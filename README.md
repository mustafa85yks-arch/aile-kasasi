# Aile Kasası — yerel şifreli sürüm

Bu paket önceki örnek demodan ayrıdır. Örnek kişi/şifre içermez. Kullanıcı hesabı veya sunucu yoktur. GitHub Pages uygulama dosyalarını sunar; kasa içeriği, ana parola ve kurtarma kodları hiçbir sunucuya gönderilmez.

## Kurulum

1. Paketteki `index.html`, `app.js`, `vault-core.js`, `sw.js`, `manifest.webmanifest`, `icon.png` ve `.nojekyll` dosyalarını aynı GitHub Pages klasörüne koyun. Sadece index.html yüklemek yeterli değildir.
2. HTTPS Pages adresini telefonda açın. Safari'de Paylaş → Ana Ekrana Ekle ile kullanabilirsiniz.
3. En az 12 karakterlik ana parola oluşturun. Üç farklı kurtarma anahtarını güvenli ve ayrı yerlerde saklayın. Her biri tek başına kasayı açar.
4. "Kişileri yönet" ile kişi ekleyin. Kayıtlar her değişiklikte otomatik şifrelenerek bu cihazın tarayıcı deposuna yazılır.
5. Kasa / Yedek → Şifreli yedeği indir ile düzenli yedek alın. Telefon içinde yerel bir konum seçin. Sistem dosya seçicisinin bulut konumlarını kullanıcı seçebilir; uygulama kendiliğinden yüklemez.

## Kullanım

- İki dakika işlem yapılmadığında, uygulama arka plana geçtiğinde veya Kilitle'ye basıldığında kilitlenir.
- Açmak için ana parola gerekir. Parolamı unuttum ile üç anahtardan biri ve yeni ana parola kullanılır.
- Kurtarma işleminde yeni veri anahtarı ve üç yeni kurtarma anahtarı üretilir. Eski anahtarlar **yeni kasa sürümünü** açamaz. Önceden indirilmiş eski yedekler eski parola/kodlarla açılmaya devam eder. Kurtarmadan sonra yeni yedek alın.
- Şifreli yedeği geri yüklemek için kilit ekranından dosya seçin; mevcut kasayı değiştirme kutusunu işaretleyin. Yeni yedek doğrulanıp parolayla/kodla açılana kadar mevcut veri değiştirilmez.
- Telefon verileri silinmişse kurtarma anahtarı tek başına yeterli değildir: şifreli yedek de gerekir. Ana parola ve üç kodun hepsi kayıpsa kurtarma hizmeti yoktur.
- Ana Ekran uygulaması ile Safari, özel/geçici oturum ve farklı tarayıcılar aynı depoyu paylaşmayabilir. Tek bir kurulumda kullanın; taşınırken yedeği kullanın.
- Uygulamadaki şifre güncellemesi banka/kurum şifresini kendiliğinden değiştirmez.

## Saklama ve gizlilik

AES-256-GCM ile veri şifrelenir. Rastgele 256 bit kasa anahtarı, PBKDF2-HMAC-SHA-256 (600.000 tur, rastgele 16 bayt salt) üzerinden türetilen ana parola anahtarıyla sarılır. Üç bağımsız 256 bit kurtarma kodunun her biri kasa anahtarını ayrı sarar. Her şifrelemede yeni 96 bit IV ve bağlam doğrulaması kullanılır. Parola/kurtarma kodu açık olarak depolanmaz.

Kasa aynı site adresi altında `localStorage` içinde şifreli tutulur. Tarayıcı/cihaz temizliği, kaldırma veya depolama baskısı veriyi silebilir; kalıcı depolama talebi garanti değildir. Kasa açıkken veri bellektedir. Panoya kopyalanan şifreyi işletim sistemi/pano geçmişi tutabilir. Web uygulaması panoyu güvenilir şekilde temizleyemez.

Uygulama dış font, analiz, uzaktan logo, reklam, hesap senkronizasyonu veya API kullanmaz. CSP, sayfadan ağ bağlantılarını engeller. Service worker sadece uygulama dosyalarını çevrimdışı önbelleğe alır; kasa içeriğini önbelleğe yazmaz. HTTPS sunucusu/GitHub, uygulama dosyası indirmelerine ait normal erişim kayıtlarını tutabilir. Koddan bağımsız işletim sistemi/tarayıcı cihaz yedeklemeleri uygulamanın denetiminde değildir.

**Bu sürüm bağımsız güvenlik denetiminden geçmedi.** Önce hayalî verilerle gerçek iPhone'da kilit, kurtarma ve yedek geri yükleme testini tamamlayın. Maddi önemi yüksek şifreler için bu doğrulamadan önce güvenmeyin. Hosting hesabı veya dağıtılan JavaScript ele geçirilirse sonraki açılışta veriye erişim riski vardır. Cihaz ele geçirilmesi ve zararlı tarayıcı eklentileri de kapsam dışıdır.

## Kontroller

Node.js ile:

```
node tests/vault.test.cjs
node tests/app.test.cjs
```

Şifreleme, üç kodun ayrı açması, yanlış parola/kod, değiştirilmiş şifreli metnin reddi, anahtar yenileme, şifreli yedek round-trip, kurulum onayı, şifreli yerel yazım, kilitte bellek temizliği ve diğer sekme üzerine yazmayı engelleme kontrol edilir. Bu testler gerçek telefon ve tarayıcı denemesinin yerini tutmaz.

## Güncellemeler

Kasa verileri kod dosyalarından ayrıdır; site adresini ve uygulama klasörünü koruyun. Güncellemeden önce şifreli yedek alın. Yeni sürümde service worker önbellek sürümü değişmeli; yeni worker devralana kadar eski sekmeleri kapatıp yeniden açmak gerekebilir.
