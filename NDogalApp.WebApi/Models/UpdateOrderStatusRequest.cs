using NDogalApp.Data.Enums;
using System.ComponentModel.DataAnnotations;

namespace NDogalApp.WebApi.Models
{
    // Sipariş durumunu güncelleme API isteği için model (Admin kullanır).
    public class UpdateOrderStatusRequest
    {
        [Required(ErrorMessage = "Yeni sipariş durumu zorunludur.")]
        [EnumDataType(typeof(OrderStatus), ErrorMessage = "Geçersiz sipariş durumu.")]
        public OrderStatus NewStatus { get; set; }

        [MaxLength(500, ErrorMessage = "Yönetici notları en fazla 500 karakter olabilir.")]
        public string? AdminNotes { get; set; } // İsteğe bağlı yönetici notu
    }
}