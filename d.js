const fs = require("fs");
const path = require("path");
const PNG = require("pngjs").PNG;
const pixelmatch = require("pixelmatch");

const compareImagesInFolder = async (folderPath) => {
  try {
    console.log("> Started comparing images in folder:", folderPath);

    const files = fs.readdirSync(folderPath);
    const images = files.filter((file) => {
      const extension = path.extname(file).toLowerCase();
      return (
        extension === ".png" || extension === ".jpg" || extension === ".jpeg"
      );
    });

    if (images.length < 2) {
      console.log("Not enough images in the folder to compare.");
      return;
    }

    const targetWidth = 20;
    const targetHeight = 20;

    const results = [];

    for (let i = 0; i < images.length; i++) {
      let maxCompatibility = 0;
      let maxCompatibilityImage1 = "";
      let maxCompatibilityImage2 = "";
      let leastDifference = 0;

      for (let j = 0; j < images.length; j++) {
        if (i != j) {
          const image1Path = path.join(folderPath, images[i]);
          const image2Path = path.join(folderPath, images[j]);

          const img1 = PNG.sync.read(fs.readFileSync(image1Path));
          const img2 = PNG.sync.read(fs.readFileSync(image2Path));

          // Yeniden boyutlandırma işlemi
          const resizedImg1 = resizeImage(img1, targetWidth, targetHeight);
          const resizedImg2 = resizeImage(img2, targetWidth, targetHeight);

          const { width, height } = resizedImg1;
          const diff = new PNG({ width, height });

          const difference = pixelmatch(
            resizedImg1.data,
            resizedImg2.data,
            diff.data,
            width,
            height,
            {
              threshold: 0.1,
            }
          );

          const compatibility = 100 - (difference * 100) / (width * height);
          if (compatibility > maxCompatibility) {
            maxCompatibility = compatibility;
            maxCompatibilityImage1 = images[i];
            maxCompatibilityImage2 = images[j];
            leastDifference = difference;
          }
        } else {
          continue;
        }
      }

      results.push({
        image1: maxCompatibilityImage1,
        image2: maxCompatibilityImage2,
        difference: leastDifference,
        compatibility: maxCompatibility,
      });
    }

    // Benzerlik oranına göre sıralama
    results.sort((a, b) => b.compatibility - a.compatibility);

    // Sonuçları konsola yazdırma
    results.forEach((result) => {
      console.log(result);
    });
  } catch (error) {
    console.log("Error comparing images:", error);
    throw error;
  }
};

// Yardımcı işlev: Görüntüyü yeniden boyutlandırır
const resizeImage = (image, targetWidth, targetHeight) => {
  const resizedImage = new PNG({ width: targetWidth, height: targetHeight });

  for (let y = 0; y < targetHeight; y++) {
    for (let x = 0; x < targetWidth; x++) {
      const idx = (targetWidth * y + x) << 2;
      const sourceX = Math.floor((x / targetWidth) * image.width);
      const sourceY = Math.floor((y / targetHeight) * image.height);
      const sourceIdx = (image.width * sourceY + sourceX) << 2;

      resizedImage.data[idx] = image.data[sourceIdx];
      resizedImage.data[idx + 1] = image.data[sourceIdx + 1];
      resizedImage.data[idx + 2] = image.data[sourceIdx + 2];
      resizedImage.data[idx + 3] = image.data[sourceIdx + 3];
    }
  }

  return resizedImage;
};

compareImagesInFolder("imgs");
