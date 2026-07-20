export type PlanFeatureAbilities = {
    create: boolean;
    update: boolean;
    delete: boolean;
};

export type PlanOption = {
    id: string;
    name: string;
    code: string;
};

export type FeatureCatalogItem = {
    key: string;
    type: 'int' | 'bool' | 'string';
    label: string;
    options?: string[] | null;
};

export type PlanFeatureRow = {
    id: string;
    plan_id: string;
    plan_name: string | null;
    plan_code: string | null;
    feature: string;
    feature_label: string;
    value_int: number | null;
    value_bool: boolean | null;
    value_str: string | null;
    display_value: string;
};
