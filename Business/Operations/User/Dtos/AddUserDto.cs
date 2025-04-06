using System;
using NDogalApp.Data.Enums;

namespace Business.Operations.User.Dtos
{
    // Yeni kullanıcı kaydı için gerekli verileri taşıyan DTO.
    public class AddUserDto
    {
        public string Email { get; set; }
        public string Password { get; set; } // Şifrelenmemiş ham şifre
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string? PhoneNumber { get; set; } // İsteğe bağlı
        public string? Address { get; set; }     // İsteğe bağlı
    }
}