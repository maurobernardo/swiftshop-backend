import { api } from './client';

export async function uploadImageAsync(uri: string): Promise<string> {
	const form = new FormData();
	const filename = uri.split('/').pop() || 'image.jpg';
	const ext = filename.split('.').pop() || 'jpg';
	const mime = ext === 'png' ? 'image/png' : 'image/jpeg';

	form.append('file', {
		// @ts-ignore - React Native FormData file type
		uri,
		name: filename,
		type: mime,
	} as any);

	const res = await api.post('/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
	const path: string = res.data.url; // e.g. /uploads/uuid_name.jpg
	const base = api.defaults.baseURL?.replace(/\/$/, '') || '';
	return `${base}${path}`;
}






















