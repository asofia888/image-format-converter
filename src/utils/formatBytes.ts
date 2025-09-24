export const formatBytes = (bytes: number, decimals = 2): string => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

export interface FileSizeInfo {
    beforeSize: string;
    afterSize: string;
    savings: number;
}

export const calculateFileSizeInfo = (beforeFileSize: number | null, afterFileSize: number | null): FileSizeInfo | null => {
    if (!beforeFileSize || !afterFileSize) return null;

    const beforeSize = formatBytes(beforeFileSize);
    const afterSize = formatBytes(afterFileSize);
    const savings = beforeFileSize > afterFileSize
        ? Math.round(((beforeFileSize - afterFileSize) / beforeFileSize) * 100)
        : 0;

    return { beforeSize, afterSize, savings };
};
