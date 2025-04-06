using NDogalApp.Data.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NDogalApp.Business.Operations.Order.Dtos
{
    // Bir siparişin detaylarını istemciye göndermek için kullanılan DTO.
    public class OrderDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string UserFullName { get; set; } = string.Empty;
        public string UserEmail { get; set; } = string.Empty;
        public DateTime OrderDate { get; set; }
        public decimal TotalAmount { get; set; }
        public OrderStatus Status { get; set; }
        public string StatusText => Status.ToString();
        public string? ShippingAddress { get; set; }
        public string? Notes { get; set; }
        public List<OrderItemDto> Items { get; set; } = new List<OrderItemDto>(); // Siparişteki ürünler
    }
}