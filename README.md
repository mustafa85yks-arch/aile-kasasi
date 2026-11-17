# Aile Kasası (demo)

Aile üyelerinin banka/kurum hesaplarını ve şifre değişim tarihlerini tek yerde takip eden mobil öncelikli demo.

> ⚠️ **Bu bir demo, gerçek bir şifre kasası değil.** Kayıtlar yalnızca bellekte durur; sayfa yenilenince sıfırlanır.
> Ana parola, şifreli kalıcı saklama, otomatik kilit, yedekleme ve arka planda hatırlatma yok.
> **Bu repoya gerçek şifre, kullanıcı adı veya dışa aktarılmış veri girmez.**

## Neler var

- Kişiye göre süzme (kişiler yatay kayar), arama, yaklaşan / geciken değişimler (gecikenler üstte)
- Kayıt ekleme, düzenleme, silme; aile üyesi ekleme / ad değiştirme
- Kuruma özel şifre kuralı: 6/8/12/16, özel uzunluk veya en az–en çok aralığı; rakam / harf+rakam / özel karakter
- Kurala uygun şifre üretme ve elle girilen şifreyi doğrulama
- Şifre yenileme üç adımda: **üret → bankada değiştir → banka onaylayınca kayda geçir**.
  Üretilen şifre ayrı bir taslakta durur; kayıttaki şifre onay verilene kadar değişmez.

Değişim süreleri ve şifre kuralları örnektir; bankaların doğrulanmış kuralları değildir.

## Çalıştırma

`index.html` dosyasını tarayıcıda açmak yeterli; kurulum yok.

## Açık kararlar

- Gerçek şifrelerin nerede saklanacağı (hazır parola yöneticisi mi, özel şifreli kasa mı)
- Kalıcı veri, yedekleme ve hatırlatma yöntemi
