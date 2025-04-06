using NDogalApp.Data.Enums;
using System;
using System.Collections.Generic;

namespace NDogalApp.Data.Entities
{
    public class UserEntity : BaseEntity
    {
        public string Email { get; set; }
        public string Password { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public UserType UserType { get; set; }

        public string? PhoneNumber { get; set; }
        public string? Address { get; set; }

        // --- İlişkisel Özellikler ---

        public ICollection<OrderEntity> Orders { get; set; }

        public BasketEntity? Basket { get; set; }

        // Constructor
        public UserEntity()
        {
            Orders = new HashSet<OrderEntity>();
        }
    }
}