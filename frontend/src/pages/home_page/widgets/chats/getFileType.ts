export const getFileType = (ext: string | undefined) => {
    if (!ext) return 'Unknown';
    const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'];
    const videoTypes = ['mp4', 'mkv', 'mov', 'avi', 'flv', 'wmv', 'webm'];
    const audioTypes = ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a'];
    const documentTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'];

    if (imageTypes.includes(ext)) return 'Image';
    if (videoTypes.includes(ext)) return 'Video';
    if (audioTypes.includes(ext)) return 'Audio';
    if (documentTypes.includes(ext)) return 'Document';
    return 'File';
};