using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NDogalApp.Business.DataProtection
{
    // Veri şifreleme ve çözme işlemleri için kontrat.
    public interface IDataProtection
    {
        // Verilen metni şifreler.
        string Protect(string text);

        // Şifrelenmiş metni çözer.
        string UnProtect(string protectedText);
    }
}