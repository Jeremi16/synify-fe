/**
 * Utility to extract dominant color from an image
 */
export async function getDominantColor(imageUrl: string): Promise<string> {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = imageUrl;
        img.onload = () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            if (!ctx) return resolve("#1DB954"); // fallback green

            canvas.width = 1;
            canvas.height = 1;

            ctx.drawImage(img, 0, 0, 1, 1);
            const data = ctx.getImageData(0, 0, 1, 1).data;
            const r = data[0];
            const g = data[1];
            const b = data[2];

            // Convert to hex
            const hex = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
            resolve(hex);
        };
        img.onerror = () => resolve("#1DB954");
    });
}
