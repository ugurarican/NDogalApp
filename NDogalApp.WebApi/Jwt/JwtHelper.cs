using Microsoft.IdentityModel.Tokens; 
using NDogalApp.Data.Enums; 
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt; 
using System.Security.Claims; 
using System.Text;

namespace NDogalApp.WebApi.Jwt
{
    // JWT token oluşturmak için yardımcı (statik) metotlar içeren sınıf.
    public static class JwtHelper
    {
        // Verilen JwtDto bilgilerini kullanarak bir JWT token string'i oluşturur.
        public static string GenerateJwtToken(JwtDto jwtInfo)
        {
            // 1. Güvenlik Anahtarı (Secret Key) oluşturma
            // SecretKey string'ini byte dizisine çeviriyoruz. HMACSHA256 için genellikle 256 bit (32 byte) anahtar önerilir.
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtInfo.SecretKey));

            // 2. İmzalama Kimlik Bilgileri (Signing Credentials) oluşturma
            // Hangi güvenlik anahtarının ve hangi algoritmanın (HMACSHA256) kullanılacağını belirtir.
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            // 3. Token Payload'ına eklenecek Claim'leri oluşturma
            // Claim'ler, token içinde taşınacak anahtar-değer çiftleridir (kullanıcı bilgileri, roller vb.).
            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, jwtInfo.Id.ToString()), // Standart 'subject' claim'i (kullanıcı ID)
                new Claim(JwtRegisteredClaimNames.Email, jwtInfo.Email),       // Standart 'email' claim'i
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()), // Standart 'JWT ID' claim'i (her token için benzersiz)
                new Claim(JwtRegisteredClaimNames.Iat, DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64), // Standart 'issued at' claim'i

                // Özel Claim'lerimiz (JwtClaimNames sabitlerini kullanarak)
                new Claim(JwtClaimNames.Id, jwtInfo.Id.ToString()),
                new Claim(JwtClaimNames.FirstName, jwtInfo.FirstName),
                new Claim(JwtClaimNames.LastName, jwtInfo.LastName),
                new Claim(JwtClaimNames.UserType, jwtInfo.UserType.ToString()), // Enum'ı string'e çevir

                // Rol Claim'i: ASP.NET Core Authorization mekanizmasının tanıması için
                // ClaimTypes.Role kullanmak standarttır. UserType'ı role olarak ekleyelim.
                new Claim(ClaimTypes.Role, jwtInfo.UserType.ToString())
            };

            // 4. Token Geçerlilik Süresi (Expiration Time) hesaplama
            var expireTime = DateTime.UtcNow.AddMinutes(jwtInfo.ExpireMinutes);

            // 5. JwtSecurityToken Nesnesini Oluşturma
            // Issuer, Audience, Claims, Expires, SigningCredentials gibi bilgileri içerir.
            var tokenDescriptor = new JwtSecurityToken(
                issuer: jwtInfo.Issuer,
                audience: jwtInfo.Audience,
                claims: claims,
                expires: expireTime,
                signingCredentials: credentials);

            // 6. Token'ı String Formatına Dönüştürme
            // JwtSecurityTokenHandler sınıfı, JwtSecurityToken nesnesini imzalı bir JWT string'ine dönüştürür.
            var token = new JwtSecurityTokenHandler().WriteToken(tokenDescriptor);

            return token;
        }
    }
}