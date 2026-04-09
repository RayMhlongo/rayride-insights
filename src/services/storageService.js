export async function uploadDriverDocument(driverId, file, folderName) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(`Unable to read ${folderName} file.`));
    reader.readAsDataURL(file);
  });
}
