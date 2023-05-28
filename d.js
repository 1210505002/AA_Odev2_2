const fs = require("fs");
const path = require("path");
const PNG = require("pngjs").PNG;
const pixelmatch = require("pixelmatch");

const compareImagesInFolder = async (folderPath) => {
  try {
    console.log("> Klasördeki resimler karşılaştırılıyor:", folderPath);

    // Klasördeki dosyaları okuyun
    const files = fs.readdirSync(folderPath);
    
    // Resim dosyalarını filtreleyin (sadece .png, .jpg veya .jpeg uzantılı dosyaları kabul edin)
    const images = files.filter((file) => {
      const extension = path.extname(file).toLowerCase();
      return (
        extension === ".png" || extension === ".jpg" || extension === ".jpeg"
      );
    });

    if (images.length < 2) {
      console.log("Karşılaştırmak için yeterli resim bulunamadı.");
      return;
    }

    const targetWidth = 20;
    const targetHeight = 20;

    const results = [];

    // Tüm resimler için karşılaştırma yapın
    for (let i = 0; i < images.length; i++) {
      let maxCompatibility = 0;
      let maxCompatibilityImage1 = "";
      let maxCompatibilityImage2 = "";
      let leastDifference = 0;

      // Diğer resimlerle karşılaştırma yapın
      for (let j = 0; j < images.length; j++) {
        if (i != j) {
          const image1Path = path.join(folderPath, images[i]);
          const image2Path = path.join(folderPath, images[j]);

          // İlk resmi okuyun ve PNG formatına dönüştürün
          const img1 = PNG.sync.read(fs.readFileSync(image1Path));
          
          // İkinci resmi okuyun ve PNG formatına dönüştürün
          const img2 = PNG.sync.read(fs.readFileSync(image2Path));

          // Resimleri yeniden boyutlandırma
          const resizedImg1 = resizeImage(img1, targetWidth, targetHeight);
          const resizedImg2 = resizeImage(img2, targetWidth, targetHeight);

          // Yeniden boyutlandırılmış resimler arasındaki farkı hesaplayın
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

          // Uyumluluk yüzdesini hesaplayın
          const compatibility = 100 - (difference * 100) / (width * height);
          
          // En yüksek uyumluluğa sahip resimleri ve farkı kaydedin
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

      // Sonuçları sonuç dizisine ekleyin
      results.push({
        image1: maxCompatibilityImage1,
        image2: maxCompatibilityImage2,
        difference: leastDifference,
        compatibility: maxCompatibility,
      });
    }

    // Uyumluluğa göre sonuçları sıralayın
    results.sort((a, b) => b.compatibility - a.compatibility);

    // Sonuçları konsola yazdırın
    results.forEach((result) => {
      console.log(result);
    });
  } catch (error) {
    console.log("Resimler karşılaştırılırken hata oluştu:", error);
    throw error;
  }
};

// Yardımcı fonksiyon: Resmi yeniden boyutlandırır
const resizeImage = (image, targetWidth, targetHeight) => {
  const resizedImage = new PNG({ width: targetWidth, height: targetHeight });

  for (let y = 0; y < targetHeight; y++) {
    for (let x = 0; x < targetWidth; x++) {
      const idx = (targetWidth * y + x) << 2;
      const sourceX = Math.floor((x / targetWidth) * image.width);
      const sourceY = Math.floor((y / targetHeight) * image.height);
      const sourceIdx = (image.width * sourceY + sourceX) << 2;

      // Yeniden boyutlandırılmış resmin verilerini atayın
      resizedImage.data[idx] = image.data[sourceIdx];
      resizedImage.data[idx + 1] = image.data[sourceIdx + 1];
      resizedImage.data[idx + 2] = image.data[sourceIdx + 2];
      resizedImage.data[idx + 3] = image.data[sourceIdx + 3];
    }
  }

  return resizedImage;
};

compareImagesInFolder("imgs");
