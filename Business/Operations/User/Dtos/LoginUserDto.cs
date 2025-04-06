using System;

namespace NDogalApp.Business.Operations.User.Dtos
{
    // Kullanıcı girişi için gerekli verileri taşıyan DTO.
    public class LoginUserDto
    {
        public string Email { get; set; }
        public string Password { get; set; } // Şifrelenmemiş ham şifre
    }
}