import type { LucideIcon } from 'lucide-react';
import {
    Accessibility,
    Baby,
    Building2,
    Cake,
    Car,
    ChefHat,
    Coffee,
    Compass,
    CreditCard,
    Dog,
    Drumstick,
    Fish,
    Flame,
    Globe,
    Heart,
    Inbox,
    Languages,
    Leaf,
    MapPin,
    Music,
    Pizza,
    Sandwich,
    ShoppingBag,
    Smartphone,
    Sparkles,
    Sun,
    Tags,
    TreePine,
    Truck,
    Users,
    Utensils,
    UtensilsCrossed,
    Waves,
    Wifi,
    Wind,
    Zap,
} from 'lucide-react';

export type CatalogTypeKey =
    | 'cuisine'
    | 'service'
    | 'language'
    | 'ambiance'
    | 'proposals';

export type CatalogTypeTheme = {
    tabIcon: LucideIcon;
    tabActive: string;
    tabIdle: string;
    card: string;
    iconWrap: string;
    proposalAccent: string;
    proposeLink: string;
    proposeSubmit: string;
};

export const CATALOG_TYPE_THEMES: Record<CatalogTypeKey, CatalogTypeTheme> = {
    cuisine: {
        tabIcon: UtensilsCrossed,
        tabActive: 'bg-orange-600 text-white shadow-sm shadow-orange-200/60',
        tabIdle: 'text-orange-800/70 hover:bg-orange-50',
        card: 'border-orange-200/90 bg-gradient-to-br from-orange-50/90 via-white to-amber-50/50 shadow-sm shadow-orange-100/40',
        iconWrap: 'bg-orange-100 text-orange-700 ring-1 ring-orange-200/80',
        proposalAccent: 'border-l-orange-500 bg-orange-50/40',
        proposeLink:
            'text-orange-700 hover:bg-orange-100/90 hover:text-orange-800',
        proposeSubmit: 'bg-orange-600 text-white hover:bg-orange-700',
    },
    service: {
        tabIcon: Wifi,
        tabActive: 'bg-teal-600 text-white shadow-sm shadow-teal-200/60',
        tabIdle: 'text-teal-800/70 hover:bg-teal-50',
        card: 'border-teal-200/90 bg-gradient-to-br from-teal-50/90 via-white to-cyan-50/50 shadow-sm shadow-teal-100/40',
        iconWrap: 'bg-teal-100 text-teal-700 ring-1 ring-teal-200/80',
        proposalAccent: 'border-l-teal-500 bg-teal-50/40',
        proposeLink: 'text-teal-700 hover:bg-teal-100/90 hover:text-teal-800',
        proposeSubmit: 'bg-teal-600 text-white hover:bg-teal-700',
    },
    language: {
        tabIcon: Languages,
        tabActive: 'bg-brand-blue text-white shadow-sm shadow-blue-200/60',
        tabIdle: 'text-brand-blue/80 hover:bg-brand-blue/5',
        card: 'border-brand-blue/25 bg-gradient-to-br from-sky-50/90 via-white to-blue-50/40 shadow-sm shadow-blue-100/30',
        iconWrap: 'bg-brand-blue/10 text-brand-blue ring-1 ring-brand-blue/20',
        proposalAccent: 'border-l-brand-blue bg-brand-blue/6',
        proposeLink:
            'text-brand-blue hover:bg-brand-blue/10 hover:text-brand-blue',
        proposeSubmit: 'bg-brand-blue text-white hover:bg-brand-blue/90',
    },
    ambiance: {
        tabIcon: TreePine,
        tabActive: 'bg-violet-600 text-white shadow-sm shadow-violet-200/60',
        tabIdle: 'text-violet-800/70 hover:bg-violet-50',
        card: 'border-violet-200/90 bg-gradient-to-br from-violet-50/80 via-white to-fuchsia-50/40 shadow-sm shadow-violet-100/40',
        iconWrap: 'bg-violet-100 text-violet-700 ring-1 ring-violet-200/80',
        proposalAccent: 'border-l-violet-500 bg-violet-50/40',
        proposeLink:
            'text-violet-700 hover:bg-violet-100/90 hover:text-violet-800',
        proposeSubmit: 'bg-violet-600 text-white hover:bg-violet-700',
    },
    proposals: {
        tabIcon: Inbox,
        tabActive: 'bg-amber-600 text-white shadow-sm shadow-amber-200/60',
        tabIdle: 'text-amber-800/70 hover:bg-amber-50',
        card: 'border-amber-200/90 bg-gradient-to-br from-amber-50/80 via-white to-yellow-50/40',
        iconWrap: 'bg-amber-100 text-amber-800 ring-1 ring-amber-200/80',
        proposalAccent: 'border-l-amber-500 bg-amber-50/50',
        proposeLink: 'text-amber-800 hover:bg-amber-100/90 hover:text-amber-900',
        proposeSubmit: 'bg-amber-600 text-white hover:bg-amber-700',
    },
};

const LUCIDE_BY_NAME: Record<string, LucideIcon> = {
    Fish,
    Utensils,
    ChefHat,
    Flame,
    Drumstick,
    Pizza,
    Zap,
    Leaf,
    Sparkles,
    Coffee,
    Cake,
    Sandwich,
    Wifi,
    Truck,
    ShoppingBag,
    Car,
    Sun,
    Wind,
    Music,
    Compass,
    Accessibility,
    Baby,
    Dog,
    CreditCard,
    Smartphone,
    Languages,
    Globe,
    Building2,
    TreePine,
    Waves,
    Heart,
    Users,
    MapPin,
    UtensilsCrossed,
    Inbox,
    Tags,
};

const SLUG_ICONS: Record<string, LucideIcon> = {
    cebicheria: Fish,
    chifa: Utensils,
    criollo: ChefHat,
    parrilla: Flame,
    mariscos: Fish,
    polleria: Drumstick,
    'pizza-y-pasta': Pizza,
    'comida-rapida': Zap,
    'vegetariano-vegano': Leaf,
    fusion: Sparkles,
    cafeteria: Coffee,
    'postres-y-reposteria': Cake,
    'anticuchos-y-sanguches': Sandwich,
    'wifi-gratis': Wifi,
    delivery: Truck,
    'para-llevar': ShoppingBag,
    estacionamiento: Car,
    terraza: Sun,
    'aire-acondicionado': Wind,
    'musica-en-vivo': Music,
    'reservas-en-linea': Compass,
    'acceso-para-silla-de-ruedas': Accessibility,
    'zona-para-ninos': Baby,
    'pet-friendly': Dog,
    'pago-con-tarjeta': CreditCard,
    'yape-plin': Smartphone,
    espanol: Languages,
    ingles: Globe,
    portugues: Globe,
    frances: Globe,
    aleman: Globe,
    italiano: Globe,
    quechua: Languages,
    urbano: Building2,
    campestre: TreePine,
    'vista-al-mar': Waves,
    romantico: Heart,
    familiar: Users,
    casual: Coffee,
    'gourmet-fine-dining': Sparkles,
    tradicional: ChefHat,
    turistico: MapPin,
    rooftop: Sun,
};

const TYPE_FALLBACK_ICONS: Record<string, LucideIcon> = {
    cuisine: UtensilsCrossed,
    service: Wifi,
    language: Languages,
    ambiance: TreePine,
};

export function getCatalogItemIcon(
    type: string,
    slug: string,
    customIcon?: string | null,
): LucideIcon {
    if (customIcon && customIcon in LUCIDE_BY_NAME) {
        return LUCIDE_BY_NAME[customIcon];
    }

    return SLUG_ICONS[slug] ?? TYPE_FALLBACK_ICONS[type] ?? Tags;
}

export function getCatalogTypeTheme(type: string): CatalogTypeTheme {
    if (type in CATALOG_TYPE_THEMES) {
        return CATALOG_TYPE_THEMES[type as CatalogTypeKey];
    }

    return CATALOG_TYPE_THEMES.cuisine;
}
