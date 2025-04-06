using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NDogalApp.Business.Types
{
    // Servis metotlarının işlem sonucunu (başarı durumu ve mesaj) döndürmek için kullanılır.
    public class ServiceMessage
    {
        public bool IsSucceed { get; set; } // İşlem başarılı mı?
        public string Message { get; set; } = string.Empty; // Sonuç mesajı (hata veya başarı mesajı)
    }

    // Servis metotlarının işlem sonucunu ve ek bir veri (Data) döndürmesi gerektiğinde kullanılır.
    // Generic yapı <T>, her türde veri döndürmeyi sağlar.
    public class ServiceMessage<T>
    {
        public bool IsSucceed { get; set; } // İşlem başarılı mı?
        public string Message { get; set; } = string.Empty; // Sonuç mesajı
        public T? Data { get; set; } // Döndürülecek veri (nullable olabilir)
    }
}