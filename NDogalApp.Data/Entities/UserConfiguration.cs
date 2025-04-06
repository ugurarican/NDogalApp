using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace NDogalApp.Data.Entities
{
    public class UserConfiguration : BaseConfiguration<UserEntity>
    {
        public override void Configure(EntityTypeBuilder<UserEntity> builder)
        {
            base.Configure(builder);

            builder.Property(x => x.Email)
                .IsRequired()
                .HasMaxLength(100);
            builder.HasIndex(x => x.Email).IsUnique();

            builder.Property(x => x.Password)
                .IsRequired();

            builder.Property(x => x.FirstName)
                .IsRequired()
                .HasMaxLength(50);

            builder.Property(x => x.LastName)
                .IsRequired()
                .HasMaxLength(50);

            builder.Property(x => x.UserType)
                .IsRequired();

            builder.Property(x => x.PhoneNumber).IsRequired(false).HasMaxLength(20);
            builder.Property(x => x.Address).IsRequired(false).HasMaxLength(250);

            // --- İlişki Yapılandırmaları ---

           
            builder.HasMany(u => u.Orders)
                   .WithOne(o => o.User)
                   .HasForeignKey(o => o.UserId);

            builder.HasOne(u => u.Basket)
                   .WithOne(b => b.User)
                   .HasForeignKey<BasketEntity>(b => b.UserId)
                   .OnDelete(DeleteBehavior.Cascade);
            
        }
    }
}