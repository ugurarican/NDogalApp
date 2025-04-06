namespace NDogalApp.WebApi.Jwt
{
    // JWT token içindeki standart ve özel claim isimleri için sabitler.
    // Bu, kod içinde string literalleri kullanmaktan daha güvenli ve tutarlıdır.
    public static class JwtClaimNames
    {
        // Standart JWT claim isimleri
        public const string IssuedAt = "iat"; // Token oluşturulma zamanı
        public const string Expiration = "exp"; // Token son kullanma zamanı
        public const string Issuer = "iss"; // Token'ı oluşturan
        public const string Audience = "aud"; // Token'ın hedeflendiği kitle

        // Özel Claim İsimlerimiz (Payload'a ekleyeceğimiz bilgiler)
        public const string Id = "id"; // Kullanıcı ID'si
        public const string Email = "email";
        public const string FirstName = "firstName";
        public const string LastName = "lastName";
        public const string UserType = "userType"; // Enum değeri string olarak saklanacak
        public const string Roles = "roles"; // ClaimTypes.Role için alternatif veya ek
    }
}