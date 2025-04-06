using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace NDogalApp.Data.Entities
{
    // OrderEntity için Fluent API yapılandırmaları.
    public class OrderConfiguration : BaseConfiguration<OrderEntity>
    {
        public override void Configure(EntityTypeBuilder<OrderEntity> builder)
        {
            // Temel yapılandırmaları uygula
            base.Configure(builder);

            // OrderEntity'ye özel yapılandırmalar:

            builder.Property(x => x.OrderDate)
                   .IsRequired();

            builder.Property(x => x.TotalAmount)
                   .IsRequired()
                   .HasPrecision(18, 2);

            builder.Property(x => x.Status)
                   .IsRequired();

            builder.Property(x => x.ShippingAddress)
                   .IsRequired(false) // İsteğe bağlı
                   .HasMaxLength(300);

            builder.Property(x => x.Notes)
                  .IsRequired(false) // İsteğe bağlı
                  .HasMaxLength(500);

            // --- İlişki Yapılandırmaları ---

            // Order ile User arasındaki Many-to-One ilişkisi:
            builder.HasOne(o => o.User)
                   .WithMany(u => u.Orders) // UserEntity'deki Orders koleksiyonu
                   .HasForeignKey(o => o.UserId)
                   .IsRequired()
                   .OnDelete(DeleteBehavior.Restrict);

            // Order ile OrderItem arasındaki One-to-Many ilişkisi:
            builder.HasMany(o => o.OrderItems) // Bu siparişin çok sayıda öğesi var
                   .WithOne(oi => oi.Order)     // Her öğe bir siparişe ait
                   .HasForeignKey(oi => oi.OrderId) // OrderItem'daki FK: OrderId
                   .IsRequired()
                   .OnDelete(DeleteBehavior.Cascade);
        }
    }
}