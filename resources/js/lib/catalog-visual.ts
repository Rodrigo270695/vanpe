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
    chipSelected: string;
    chipIdle: string;
    proposalAccent: string;
    proposeLink: string;
    proposeSubmit: string;
};

export const CATALOG_TYPE_THEMES: Record<CatalogTypeKey, CatalogTypeTheme> = {
    cuisine: {
        tabIcon: UtensilsCrossed,
        tabActive: 'bg-orange-600 text-white shadow-sm shadow-orange-200/60 dark:shadow-none',
        tabIdle: 'text-orange-800/70 hover:bg-orange-50 dark:text-orange-300/80 dark:hover:bg-orange-500/10',
        card: 'border-orange-200/90 bg-gradient-to-br from-orange-50/90 via-white to-amber-50/50 shadow-sm shadow-orange-100/40 dark:border-orange-500/25 dark:from-orange-950/50 dark:via-card dark:to-amber-950/30 dark:shadow-none',
        iconWrap:
            'bg-orange-100 text-orange-700 ring-1 ring-orange-200/80 dark:bg-orange-500/20 dark:text-orange-300 dark:ring-orange-400/30',
        chipSelected:
            'border-orange-600 bg-orange-600 text-white dark:border-orange-500 dark:bg-orange-600',
        chipIdle:
            'border-border bg-background/80 text-foreground hover:border-orange-400/50 hover:bg-orange-50 dark:border-white/12 dark:bg-white/5 dark:hover:border-orange-400/40 dark:hover:bg-orange-500/15',
        proposalAccent: 'border-l-orange-500 bg-orange-50/40 dark:bg-orange-500/10',
        proposeLink:
            'text-orange-700 hover:bg-orange-100/90 hover:text-orange-800 dark:text-orange-300 dark:hover:bg-orange-500/15 dark:hover:text-orange-200',
        proposeSubmit: 'bg-orange-600 text-white hover:bg-orange-700',
    },
    service: {
        tabIcon: Wifi,
        tabActive: 'bg-teal-600 text-white shadow-sm shadow-teal-200/60 dark:shadow-none',
        tabIdle: 'text-teal-800/70 hover:bg-teal-50 dark:text-teal-300/80 dark:hover:bg-teal-500/10',
        card: 'border-teal-200/90 bg-gradient-to-br from-teal-50/90 via-white to-cyan-50/50 shadow-sm shadow-teal-100/40 dark:border-teal-500/25 dark:from-teal-950/50 dark:via-card dark:to-cyan-950/30 dark:shadow-none',
        iconWrap:
            'bg-teal-100 text-teal-700 ring-1 ring-teal-200/80 dark:bg-teal-500/20 dark:text-teal-300 dark:ring-teal-400/30',
        chipSelected:
            'border-teal-600 bg-teal-600 text-white dark:border-teal-500 dark:bg-teal-600',
        chipIdle:
            'border-border bg-background/80 text-foreground hover:border-teal-400/50 hover:bg-teal-50 dark:border-white/12 dark:bg-white/5 dark:hover:border-teal-400/40 dark:hover:bg-teal-500/15',
        proposalAccent: 'border-l-teal-500 bg-teal-50/40 dark:bg-teal-500/10',
        proposeLink:
            'text-teal-700 hover:bg-teal-100/90 hover:text-teal-800 dark:text-teal-300 dark:hover:bg-teal-500/15 dark:hover:text-teal-200',
        proposeSubmit: 'bg-teal-600 text-white hover:bg-teal-700',
    },
    language: {
        tabIcon: Languages,
        tabActive: 'bg-brand-blue text-white shadow-sm shadow-blue-200/60 dark:shadow-none',
        tabIdle: 'text-brand-blue/80 hover:bg-brand-blue/5 dark:text-sky-300/90 dark:hover:bg-brand-blue/15',
        card: 'border-brand-blue/25 bg-gradient-to-br from-sky-50/90 via-white to-blue-50/40 shadow-sm shadow-blue-100/30 dark:border-brand-blue/35 dark:from-sky-950/40 dark:via-card dark:to-blue-950/30 dark:shadow-none',
        iconWrap:
            'bg-brand-blue/10 text-brand-blue ring-1 ring-brand-blue/20 dark:bg-brand-blue/25 dark:text-sky-300 dark:ring-brand-blue/40',
        chipSelected:
            'border-brand-blue bg-brand-blue text-white dark:border-sky-500 dark:bg-brand-blue',
        chipIdle:
            'border-border bg-background/80 text-foreground hover:border-brand-blue/40 hover:bg-brand-blue/5 dark:border-white/12 dark:bg-white/5 dark:hover:border-sky-400/40 dark:hover:bg-brand-blue/20',
        proposalAccent: 'border-l-brand-blue bg-brand-blue/6 dark:bg-brand-blue/15',
        proposeLink:
            'text-brand-blue hover:bg-brand-blue/10 hover:text-brand-blue dark:text-sky-300 dark:hover:bg-brand-blue/20',
        proposeSubmit: 'bg-brand-blue text-white hover:bg-brand-blue/90',
    },
    ambiance: {
        tabIcon: TreePine,
        tabActive: 'bg-violet-600 text-white shadow-sm shadow-violet-200/60 dark:shadow-none',
        tabIdle: 'text-violet-800/70 hover:bg-violet-50 dark:text-violet-300/80 dark:hover:bg-violet-500/10',
        card: 'border-violet-200/90 bg-gradient-to-br from-violet-50/80 via-white to-fuchsia-50/40 shadow-sm shadow-violet-100/40 dark:border-violet-500/25 dark:from-violet-950/50 dark:via-card dark:to-fuchsia-950/25 dark:shadow-none',
        iconWrap:
            'bg-violet-100 text-violet-700 ring-1 ring-violet-200/80 dark:bg-violet-500/20 dark:text-violet-300 dark:ring-violet-400/30',
        chipSelected:
            'border-violet-600 bg-violet-600 text-white dark:border-violet-500 dark:bg-violet-600',
        chipIdle:
            'border-border bg-background/80 text-foreground hover:border-violet-400/50 hover:bg-violet-50 dark:border-white/12 dark:bg-white/5 dark:hover:border-violet-400/40 dark:hover:bg-violet-500/15',
        proposalAccent: 'border-l-violet-500 bg-violet-50/40 dark:bg-violet-500/10',
        proposeLink:
            'text-violet-700 hover:bg-violet-100/90 hover:text-violet-800 dark:text-violet-300 dark:hover:bg-violet-500/15 dark:hover:text-violet-200',
        proposeSubmit: 'bg-violet-600 text-white hover:bg-violet-700',
    },
    proposals: {
        tabIcon: Inbox,
        tabActive: 'bg-amber-600 text-white shadow-sm shadow-amber-200/60 dark:shadow-none',
        tabIdle: 'text-amber-800/70 hover:bg-amber-50 dark:text-amber-300/80 dark:hover:bg-amber-500/10',
        card: 'border-amber-200/90 bg-gradient-to-br from-amber-50/80 via-white to-yellow-50/40 dark:border-amber-500/25 dark:from-amber-950/40 dark:via-card dark:to-yellow-950/20',
        iconWrap:
            'bg-amber-100 text-amber-800 ring-1 ring-amber-200/80 dark:bg-amber-500/20 dark:text-amber-300 dark:ring-amber-400/30',
        chipSelected:
            'border-amber-600 bg-amber-600 text-white dark:border-amber-500 dark:bg-amber-600',
        chipIdle:
            'border-border bg-background/80 text-foreground hover:border-amber-400/50 hover:bg-amber-50 dark:border-white/12 dark:bg-white/5 dark:hover:border-amber-400/40 dark:hover:bg-amber-500/15',
        proposalAccent: 'border-l-amber-500 bg-amber-50/50 dark:bg-amber-500/10',
        proposeLink:
            'text-amber-800 hover:bg-amber-100/90 hover:text-amber-900 dark:text-amber-300 dark:hover:bg-amber-500/15',
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
