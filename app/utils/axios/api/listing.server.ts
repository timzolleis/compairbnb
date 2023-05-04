import axios from 'axios';
import { GPStaysDeferredSections } from '~/types/airbnb-listing-price';
import { ListingDetails } from '~/types/airbnb-listing-details';
import { ListingAvailability } from '~/types/airbnb-listing-availability';

function getClient(baseUrl?: string) {
    return axios.create({
        baseURL: baseUrl,
        headers: {
            'User-Agent':
                'Airbnb/23.17.1 Name/GLOBAL_TRAVEL AppVersion/23.17.1 ReleaseStage/live iPhone/16.4.1 Type/Phone',
            'X-Airbnb-Currency': 'EUR',
            'X-Airbnb-API-Key': '915pw2pnf4h1aiguhph5gc5b2',
        },
    });
}

function encodeListingId(listingId: string) {
    return Buffer.from(`StayListing:${listingId}`).toString('base64');
}

interface ListingDetailsProps {
    guests: number;
    checkIn: string;
    checkOut: string;
    listingId: string;
}

export async function getListing({ guests, checkIn, checkOut, listingId }: ListingDetailsProps) {
    const config = {
        guests: 1,
        checkIn: '2023-06-19',
        checkOut: '2023-06-26',
        listingId: '3001260',
    };
    const availability = await checkAvailability({
        checkIn: config.checkIn,
        checkOut: config.checkOut,
        listingId: config.listingId,
    });
    if (!availability.isAvailableDuringRequestedTimeframe) {
        throw new Error('Not available during requested timeframe');
    }
    const pricing = await getListingPrice({
        guests: config.guests,
        checkIn: config.checkIn,
        checkOut: config.checkOut,
        listingId: config.listingId,
    });
    const listingDetails = await getListingDetails(config.listingId);

    return { pricing, listingDetails, availability };
}

//TODO: Check if potential for cleanup
async function checkAvailability({
    checkIn,
    checkOut,
    listingId,
}: Omit<ListingDetailsProps, 'guests'>) {
    const url = 'https://api.airbnb.com/v2';
    const splitDate = checkIn.split('-');
    const year = splitDate[0];
    const checkInMonth = checkIn.split('-')[1];
    const checkoutMonth = checkOut.split('-')[1];
    const client = getClient(url);
    const response = await client.get<ListingAvailability>('homes_pdp_availability_calendar', {
        params: {
            listing_id: listingId,
            month: checkInMonth,
            year: year,
            count: 2,
        },
    });

    const data = response.data;
    const beginningMonth = response.data.calendar_months.find(
        (m) => m.month === parseInt(checkInMonth)
    );
    if (!beginningMonth) throw new Error('There was an error retrieving availability information');
    const endingMonth = response.data.calendar_months.find(
        (m) => m.month === parseInt(checkoutMonth)
    );
    if (!endingMonth) throw new Error('There was an error retrieving availability information');
    const beginningMonthIndex = response.data.calendar_months.indexOf(beginningMonth);
    const endingMonthIndex = response.data.calendar_months.indexOf(endingMonth);
    const relevantMonths = response.data.calendar_months.slice(
        beginningMonthIndex,
        endingMonthIndex + 1
    );
    let isAvailableDuringRequestedTimeframe = true;
    const beginningDayDate = new Date(checkIn);
    const endingDayDate = new Date(checkOut);
    relevantMonths.forEach((month) => {
        month.days.forEach((day) => {
            const date = new Date(day.date);
            if (
                date > beginningDayDate &&
                date < endingDayDate &&
                isAvailableDuringRequestedTimeframe
            ) {
                isAvailableDuringRequestedTimeframe = day.available;
            }
        });
    });
    return { isAvailableDuringRequestedTimeframe, data };
}

export async function getListingDetails(listingId: string) {
    const url = 'https://api.airbnb.com/v1/listings';
    const client = getClient(url);
    const response = await client.get<ListingDetails>(listingId);
    return response.data;
}

async function getListingPrice({ guests, checkIn, checkOut, listingId }: ListingDetailsProps) {
    const { variables, extensions } = createListingArguments({
        guests,
        checkIn,
        checkOut,
        listingId,
    });
    const url = 'https://api.airbnb.com/v3/GPStaysDeferredSections';
    const client = getClient();
    const response = await client.get<GPStaysDeferredSections>(url, {
        params: {
            operationType: 'query',
            variables: variables,
            extensions: extensions,
            operationName: 'GPStaysDeferredSections',
        },
    });
    const bookingSection =
        response.data.data.presentation.stayProductDetailPage.sections.sections.find(
            (section) => section.sectionId === 'BOOK_IT_FLOATING_FOOTER'
        );
    const totalPriceDetail =
        bookingSection?.section?.structuredDisplayPrice?.explanationData.priceDetails.find(
            (detail) => detail.items.some((item) => item.description === 'Total')
        );
    const pricePerNightDetail = bookingSection?.section?.structuredDisplayPrice?.primaryLine;
    return { totalPriceDetail, pricePerNightDetail };
}

function createListingArguments({ guests, checkIn, checkOut, listingId }: ListingDetailsProps) {
    const listingOptions = {
        id: encodeListingId(listingId),
        request: {
            adults: guests,
            checkIn: checkIn,
            checkOut: checkOut,
            children: '0',
            federatedSearchId: '929e4bff-3fd2-490a-ab6e-c9a05fd839b5',
            infants: '0',
            interactionType: 'pageload',
            isChinaPrefillFlexibleDateFlow: false,
            layouts: ['SINGLE_COLUMN'],
            p3ImpressionId: 'pdp_ios_4DB732C6-B4DE-443B-973E-626DA293B89C',
            pets: 0,
            searchId: '',
            sectionIds: ['BOOK_IT_FLOATING_FOOTER'],
        },
    };
    const extensionOptions = {
        persistedQuery: {
            sha256Hash: '1a4fc9390f7097a8b0bb131ac23be2d99fc9045a9bc4cf215448756ea4d7aa69',
            version: 1,
        },
    };
    const variables = JSON.stringify(listingOptions);
    const extensions = JSON.stringify(extensionOptions);
    return { variables, extensions };
}
