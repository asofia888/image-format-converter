export const formatBytes = (bytes: number, decimals = 2): string => {
    if (!+bytes) return '0 Bytes';

    // Handle negative numbers
    if (bytes < 0) return 'NaN Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    // Ensure i is within the bounds of the sizes array
    const sizeIndex = Math.min(i, sizes.length - 1);

    return `${parseFloat((bytes / Math.pow(k, sizeIndex)).toFixed(dm))} ${sizes[sizeIndex]}`;
};

export interface FileSizeInfo {
    beforeSize: string;
    afterSize: string;
    savings: number;
}

export const calculateFileSizeInfo = (beforeFileSize: number | null | undefined, afterFileSize: number | null | undefined): FileSizeInfo | null => {
    if (!beforeFileSize || !afterFileSize) return null;

    const beforeSize = formatBytes(beforeFileSize);
    const afterSize = formatBytes(afterFileSize);
    const savings = beforeFileSize > afterFileSize
        ? Math.round(((beforeFileSize - afterFileSize) / beforeFileSize) * 100)
        : 0;

    return { beforeSize, afterSize, savings };
};
