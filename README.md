# Aile Kasası — yerel şifreli sürüm

Bu paket önceki örnek demodan ayrıdır. Örnek kişi/şifre içermez. Kullanıcı hesabı veya sunucu yoktur. GitHub Pages uygulama dosyalarını sunar; kasa içeriği, şifre ve hatırlatma sorularının cevapları hiçbir sunucuya gönderilmez.

## Kurulum

1. Paketteki `index.html`, `app.js`, `vault-core.js`, `sw.js`, `manifest.webmanifest`, `icon.png` ve `.nojekyll` dosyalarını aynı GitHub Pages klasörüne koyun. Sadece index.html yüklemek yeterli değildir.
2. HTTPS Pages adresini telefonda açın. Safari'de Paylaş → Ana Ekrana Ekle ile kullanabilirsiniz.
3. 4 haneli rakam şifre oluşturun ve iki hatırlatma sorusu seçip cevaplayın (ör. annenizin kızlık soyadı, ilk evcil hayvanınızın adı).
4. "Kişileri yönet" ile kişi ekleyin. Kayıtlar her değişiklikte otomatik şifrelenerek bu cihazın tarayıcı deposuna yazılır.
5. Kasa / Yedek → Şifreli yedeği indir ile düzenli yedek alın. Telefon içinde yerel bir konum seçin. Sistem dosya seçicisinin bulut konumlarını kullanıcı seçebilir; uygulama kendiliğinden yüklemez.

## Kullanım

- İki dakika işlem yapılmadığında, uygulama arka plana geçtiğinde veya Kilitle'ye basıldığında kilitlenir.
- Açmak için 4 haneli şifre gerekir. Şifremi unuttum ile iki soru cevaplanır ve yeni 4 haneli şifre konur. Cevaplarda büyük/küçük harf, fazla boşluk ve Türkçe karakter fark etmez (Öztürk = ozturk).
- Eski sürümde (kurtarma anahtarlı) kurulmuş bir kasa, Şifremi unuttum ekranında kurtarma anahtarıyla açılır ve bu sırada hatırlatma soruları belirlenir.
- Şifreli yedeği geri yüklemek için kilit ekranından dosya seçin; mevcut kasayı değiştirme kutusunu işaretleyin. Yeni yedek doğrulanıp şifreyle ya da sorularla açılana kadar mevcut veri değiştirilmez.
- Telefon verileri silinmişse soruların cevabı tek başına yeterli değildir: şifreli yedek de gerekir. Şifre de cevaplar da unutulursa kurtarma yoktur.
- Ana Ekran uygulaması ile Safari, özel/geçici oturum ve farklı tarayıcılar aynı depoyu paylaşmayabilir. Tek bir kurulumda kullanın; taşınırken yedeği kullanın.
- Uygulamadaki şifre güncellemesi banka/kurum şifresini kendiliğinden değiştirmez.

## Saklama ve gizlilik

AES-256-GCM ile veri şifrelenir. Rastgele 256 bit kasa anahtarı, PBKDF2-HMAC-SHA-256 (600.000 tur, rastgele 16 bayt salt) üzerinden 4 haneli şifreden türetilen anahtarla sarılır. 4 haneli şifre yalnızca 10.000 olasılıktır: şifreli yedek dosyası veya telefonun tarayıcı deposu başkasının eline geçerse deneme yoluyla açılabilir. Yedek dosyasını kimseyle paylaşmayın. İki sorunun cevabı (küçük harfe çevrilip Türkçe karakterleri sadeleştirilerek) aynı yöntemle ayrı bir salt ile anahtara çevrilir ve kasa anahtarını ayrıca sarar. Cevaplar açık olarak saklanmaz; sorular açık saklanır. Anne kızlık soyadı gibi cevaplar tahmin edilebilir: yakınlarınızın bilmeyeceği cevaplar seçin. Her şifrelemede yeni 96 bit IV ve bağlam doğrulaması kullanılır. Şifre ve cevaplar açık olarak depolanmaz.

Kasa aynı site adresi altında `localStorage` içinde şifreli tutulur. Tarayıcı/cihaz temizliği, kaldırma veya depolama baskısı veriyi silebilir; kalıcı depolama talebi garanti değildir. Kasa açıkken veri bellektedir. Panoya kopyalanan şifreyi işletim sistemi/pano geçmişi tutabilir. Web uygulaması panoyu güvenilir şekilde temizleyemez.

Uygulama dış font, analiz, uzaktan logo, reklam, hesap senkronizasyonu veya API kullanmaz. CSP, sayfadan ağ bağlantılarını engeller. Service worker sadece uygulama dosyalarını çevrimdışı önbelleğe alır; kasa içeriğini önbelleğe yazmaz. HTTPS sunucusu/GitHub, uygulama dosyası indirmelerine ait normal erişim kayıtlarını tutabilir. Koddan bağımsız işletim sistemi/tarayıcı cihaz yedeklemeleri uygulamanın denetiminde değildir.

**Bu sürüm bağımsız güvenlik denetiminden geçmedi.** Önce hayalî verilerle gerçek iPhone'da kilit, kurtarma ve yedek geri yükleme testini tamamlayın. Maddi önemi yüksek şifreler için bu doğrulamadan önce güvenmeyin. Hosting hesabı veya dağıtılan JavaScript ele geçirilirse sonraki açılışta veriye erişim riski vardır. Cihaz ele geçirilmesi ve zararlı tarayıcı eklentileri de kapsam dışıdır.

## Kontroller

Node.js ile:

```
node tests/vault.test.cjs
node tests/app.test.cjs
```

Şifreleme, 4 haneli şifre kuralı, hatırlatma sorularıyla açma (harf/Türkçe karakter farkı gözetmeden), yanlış şifre/cevap, değiştirilmiş şifreli metnin reddi, anahtar yenileme, şifreli yedek round-trip,  şifreli yerel yazım, kilitte bellek temizliği ve diğer sekme üzerine yazmayı engelleme kontrol edilir. Bu testler gerçek telefon ve tarayıcı denemesinin yerini tutmaz.

## Güncellemeler

Kasa verileri kod dosyalarından ayrıdır; site adresini ve uygulama klasörünü koruyun. Güncellemeden önce şifreli yedek alın. Yeni sürümde service worker önbellek sürümü değişmeli; yeni worker devralana kadar eski sekmeleri kapatıp yeniden açmak gerekebilir.
