import DOMPurify from 'dompurify';

const strictConfig = {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    ALLOW_DATA_ATTR: false,
};

export function clean_data(data: string): string {
    return DOMPurify.sanitize(data, strictConfig);
}
