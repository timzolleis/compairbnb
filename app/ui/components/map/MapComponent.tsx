import { ClientOnly } from '~/ui/components/common/ClientOnly';
import { map, Map, MapProps, StaticMap } from '~/ui/components/map/map.client';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';

export const MapComponent = ({ height, lat, long, setPosition, rounded }: MapProps) => {
    return (
        <div className={'flex-1'}>
            <ClientOnly
                fallback={
                    <div
                        className={`h-[${height}px] bg-gray-500 rounded-xl`}
                        id='skeleton'
                        style={{ height: `${height}px`, background: '#d1d1d1' }}
                    />
                }>
                {() => (
                    <Map
                        setPosition={setPosition}
                        height={height}
                        lat={lat}
                        long={long}
                        rounded={rounded}
                    />
                )}
            </ClientOnly>
        </div>
    );
};

export const StaticMapComponent = ({
    height,
    lat,
    long,
    rounded,
}: Omit<MapProps, 'setPosition'>) => {
    const position = { lat: lat, lng: long };
    return (
        <div className={'flex-1'}>
            <ClientOnly
                fallback={
                    <div
                        className={`h-[${height}px] bg-gray-500 rounded-xl`}
                        id='skeleton'
                        style={{ height: `${height}px`, background: '#d1d1d1' }}
                    />
                }>
                {() => (
                    <div style={{ height: `${height}px` }}>
                        <StaticMap height={height} lat={lat} long={long} rounded={rounded} />
                    </div>
                )}
            </ClientOnly>
        </div>
    );
};
