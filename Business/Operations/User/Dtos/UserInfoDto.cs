using System;
using NDogalApp.Data.Enums;

namespace NDogalApp.Business.Operations.User.Dtos
{
    // Başarılı giriş sonrası veya kullanıcı bilgisi gerektiğinde istemciye
    // gönderilecek temel (hassas olmayan) kullanıcı bilgilerini içeren DTO.
    public class UserInfoDto
    {
        public int Id { get; set; } // JWT içine koymak için Id önemli
        public string Email { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public UserType UserType { get; set; }
        public string? PhoneNumber { get; set; } // İsteğe bağlı
        public string? Address { get; set; }     // İsteğe bağlı
    }
}