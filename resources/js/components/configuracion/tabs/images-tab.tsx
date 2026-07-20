import { Camera } from 'lucide-react';
import { ConfigSection } from '@/components/configuracion/config-section';
import type { ConfigProfile, ConfigVenue } from '@/components/configuracion/types';
import { VenueImagesSection } from '@/components/configuracion/venue-images-section';
import { useTranslations } from '@/hooks/use-translations';

type ImagesTabProps = {
    profile: ConfigProfile;
    venue: ConfigVenue;
    canManage: boolean;
};

export function ImagesTab({ profile, venue, canManage }: ImagesTabProps) {
    const { t } = useTranslations();

    return (
        <ConfigSection
            title={t('configuracion.section_venue_images')}
            description={t('configuracion.section_venue_images_hint')}
            icon={<Camera className="size-5" />}
            iconClass="bg-violet-100 text-violet-700 ring-violet-200/80 dark:bg-violet-500/20 dark:text-violet-300"
            headerClass="bg-gradient-to-r from-violet-500/10 via-fuchsia-50/70 to-brand-orange/8"
            stack
        >
            <VenueImagesSection
                logoUrl={profile.logo_url}
                portadaUrl={profile.portada_url}
                venue={venue}
                canManage={canManage}
            />
        </ConfigSection>
    );
}
