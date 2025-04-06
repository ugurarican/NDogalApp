using Microsoft.AspNetCore.DataProtection;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NDogalApp.Business.DataProtection
{
    public class DataProtection : IDataProtection
    {
        // Veriyi şifrelemek/çözmek için kullanılacak asıl nesne.
        private readonly IDataProtector _protector;

        public DataProtection(IDataProtectionProvider provider)
        {
            _protector = provider.CreateProtector("NDogalApp-security-v1");
        }

        // Verilen metni şifreler.
        public string Protect(string text)
        {
            return _protector.Protect(text);
        }

        // Şifrelenmiş metni çözer. Eğer metin bu protector ile şifrelenmemişse veya anahtar değişmişse hata verir.
        public string UnProtect(string protectedText)
        {
            try // Unprotect işlemi başarısız olabilir (örn: geçersiz format, anahtar uyumsuzluğu)
            {
                return _protector.Unprotect(protectedText);
            }
            catch (System.Security.Cryptography.CryptographicException)
            {
                return string.Empty;
            }
        }
    }
}