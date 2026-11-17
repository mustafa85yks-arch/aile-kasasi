# Aile Kasası — Demo

Mobil öncelikli hesap ve şifre değişim takibi prototipi. Kurulum ve derleme gerektirmez.

**Yalnızca örnek demo içindir. Gerçek şifre veya kişisel bilgi girmeyin.**
Veriler yalnızca sayfanın belleğindedir; yenilemede örnek kayıtlar geri gelir.
Kullanıcı hesabı, ana parola, kalıcı saklama, şifreli kasa ve sunucu yoktur.
Şifre üretmek veya kaydı güncellemek banka/kurumdaki gerçek şifreyi değiştirmez.

## GitHub Pages ile yayın

1. ZIP'i açın. Bu klasörün içindeki dosyaları GitHub reponuzun köküne yükleyin. `index.html` kökte olmalı.
2. Repo **Settings → Pages** bölümünde **Deploy from a branch** seçin.
3. **main** dalını ve **/ (root)** klasörünü seçip kaydedin.
4. GitHub'ın verdiği Pages adresini açın. Yükleme tamamlanması birkaç dakika sürebilir.

Örnek adres: `https://KULLANICI.github.io/REPO/`.
Hesabınızın planına göre Pages için herkese açık repo gerekebilir.

## İçerik

- Kişi yönetimi, onaylı kişi ve hesap silme
- Arama ve yer değiştirmeyen hesap kartları
- Dokunarak kart seçimi
- Şifre üretici: uzunluk, aralık, rakam/harf/işaret ayarları
- Elle girilen şifrelerde üretici kuralı zorlaması yok
- Şifre geçmişi, göster/gizle ve kopyalama
- Kaydetmede parlaklık; kopyalamada sarı vurgu
- Ana uygulama logosu mevcut; kurum logoları yok

Kopyalama tarayıcı iznine bağlıdır; doğrudan açılan dosya veya gömülü önizlemede engellenebilir. HTTPS Pages adresinde deneyin.

## Yerelde deneme

`index.html` dosyasını tarayıcıda açın. Tüm görseller dosyanın içindedir;
yazı tipleri cihazdan kullanılır. Haricî font veya logo servisi çağrılmaz.

## Gerçek kullanıma geçiş

Bu demo güvenli bir şifre yöneticisi değildir. Gerçek kullanım için veri saklama,
kimlik doğrulama, şifreleme ve yedekleme mimarisi ayrıca hazırlanmalıdır.
