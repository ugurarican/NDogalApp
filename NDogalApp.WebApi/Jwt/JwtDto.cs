using NDogalApp.Data.Enums; 
namespace NDogalApp.WebApi.Jwt
{
    // JWT token oluşturmak için JwtHelper'a gönderilecek bilgileri içeren DTO.
    public class JwtDto
    {
        // Token payload'una eklenecek kullanıcı bilgileri
        public int Id { get; set; }
        public string Email { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public UserType UserType { get; set; }

        // Token oluşturma parametreleri (appsettings'den okunacak)
        public string SecretKey { get; set; }
        public string Issuer { get; set; }
        public string Audience { get; set; }
        public int ExpireMinutes { get; set; }
    }
}