import type { DataFunctionArgs, V2_MetaFunction } from '@remix-run/node';
import { requireUser } from '~/utils/auth/session.server';
import { json } from '@remix-run/node';
import { Link, Outlet, useLoaderData } from '@remix-run/react';
import { NoItemsComponent } from '~/ui/components/error/NoItemsComponent';
import { getListing } from '~/utils/axios/api/listing.server';
import { getUserBalloons } from '~/models/balloon.server';
import { BalloonIllustration } from '~/ui/illustrations/BalloonIllustration';
import { ChevronUpIcon } from '~/ui/icons/ChevronUpIcon';
import { Container } from '~/ui/components/common/Container';
import { useOptionalUser } from '~/utils/hooks/user';
import { UserMenuComponent } from '~/ui/components/user/UserMenuComponent';

export const meta: V2_MetaFunction = () => {
    return [{ title: 'React leaflet example' }];
};

export default function Index() {
    return (
        <main className={'flex flex-col w-full items-center leading-tight'}>
            <GetStartedComponent />
            <h2 className={'font-semibold text-display-2xl text-center'}>Comparing made easy.</h2>
            <p className={'max-w-xl mx-auto text-center mt-5 text-gray-600'}>
                <span className={'font-medium'}>compairbnb</span> helps you find your next airbnb
                with ease. Compare prices, distances, criteria - alone or with your friends.
            </p>
        </main>
    );
}

const GetStartedComponent = () => {
    const user = useOptionalUser();

    return (
        <Link
            to={user ? '/balloons' : '/login'}
            className={
                'rounded-full px-5 bg-white py-2 border border-neutral-200 text-gray-600 font-medium text-sm flex items-center gap-2'
            }>
            <p>Get started comparing your airbnbs right away</p>
            <ChevronUpIcon direction={'right'}></ChevronUpIcon>
        </Link>
    );
};
