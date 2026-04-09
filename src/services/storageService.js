import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../firebase/config';

export async function uploadDriverDocument(driverId, file, folderName) {
  const fileRef = ref(storage, `drivers/${driverId}/${folderName}-${Date.now()}-${file.name}`);
  await uploadBytes(fileRef, file);
  return getDownloadURL(fileRef);
}
