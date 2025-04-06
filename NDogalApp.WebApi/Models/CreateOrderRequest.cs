using System.ComponentModel.DataAnnotations;

namespace NDogalApp.WebApi.Models
{
    // Sipariş oluşturma API isteği için model.
    // Sepetten oluşturulacağı için genellikle ek bilgiye ihtiyaç duymaz,
    // ancak teslimat adresi veya not gibi opsiyonel alanlar eklenebilir.
    public class CreateOrderRequest
    {
        [MaxLength(300, ErrorMessage = "Teslimat adresi en fazla 300 karakter olabilir.")]
        public string? ShippingAddress { get; set; } // İsteğe bağlı

        [MaxLength(500, ErrorMessage = "Notlar en fazla 500 karakter olabilir.")]
        public string? Notes { get; set; }           // İsteğe bağlı
    }
}