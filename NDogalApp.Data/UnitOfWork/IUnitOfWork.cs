using System;
using System.Threading.Tasks;

namespace NDogalApp.Data.UnitOfWork
{
    public interface IUnitOfWork : IDisposable
    {
        // Değişiklikleri veritabanına kaydeder.
        // Etkilenen satır sayısını döner.
        Task<int> SaveChangesAsync();

        // Yeni bir veritabanı işlemi başlatır.
        Task BeginTransactionAsync();

        // Mevcut işlemi onaylar ve değişiklikleri kalıcı hale getirir.
        Task CommitTransactionAsync();

        // Mevcut işlemdeki tüm değişiklikleri geri alır.
        Task RollbackTransactionAsync();

    }
}