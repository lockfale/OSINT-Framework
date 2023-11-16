# OSINT Framework

## Notlar
Ücretsiz araçlardan veya kaynaklardan bilgi toplamaya odaklanmış OSINT çerçevesi. Amacım, insanlara ücretsiz OSINT kaynakları bulmalarında yardımcı olmaktır. İçerilen bazı siteler kayıt gerektirebilir veya daha fazla veri için ücret talep edebilir, ancak en azından mevcut bilgilerin bir kısmını ücretsiz alabilirsiniz.

Bu çerçeveyi başlangıçta bilgi güvenliği açısından oluşturdum. O zamandan beri, diğer alanlardan ve disiplinlerden gelen tepkiler inanılmaz olmuştur. Özellikle infosec dışındaki alanlardan gelen herhangi başka OSINT kaynaklarını eklemek isterim. Eksik olan herhangi bir şeyi bana bildirin lütfen!

Lütfen çerçeveyi aşağıdaki bağlantıda ziyaret edin 

[https://osintframework.com](https://osintframework.com)

### Anlam Tablosu
(T) - Yerel olarak yüklenip çalıştırılması gereken bir araca işaret eder  
(D) - Daha fazla bilgi için Google Dork, [Google Hacking](https://en.wikipedia.org/wiki/Google_hacking) sayfasına bakınız  
(R) - Kayıt gerektirir  
(M) - Arama terimini içeren bir URL'yi ve URL'nin elle düzenlenmesi gerektiğini gösterir  

### Öneriler, Yorumlar, Geri Bildirim
Geri bildirim veya yeni araç önerileri son derece hoş geldiniz! Lütfen bir pull request göndermek veya github üzerinde bir sorun açmak veya Twitter üzerinden iletişim kurmak konusunda özgür hissedin.

### GitHub Pull Request ile Katkıda Bulunun
Yeni kaynaklar için, lütfen sitenin kamuya açık ve ücretsiz kullanılabilir olduğundan emin olun.
1. Arf.json dosyasını aşağıda gösterildiği biçimde güncelleyin. Eğer bu bir klasör için ilk giriş değilse, önceki girişin son kapanış parantezine bir virgül ekleyin.

   ```json
   {
     "name": "Örnek Adı",
     "type": "url",
     "url": "http://example.com"
   }
