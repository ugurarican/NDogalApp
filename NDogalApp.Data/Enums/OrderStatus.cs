namespace NDogalApp.Data.Enums
{
    public enum OrderStatus
    {
        PendingApproval = 1,    // Onay Bekliyor
        Approved = 2,           // Onaylandı
        Shipped = 3,            // Kargoya Verildi/Yola Çıktı (Tamamı)
        Delivered = 4,          // Teslim Edildi (Tamamı)
        CancelledByCustomer = 5,// Müşteri Tarafından İptal Edildi
        CancelledByAdmin = 6,   // Yönetici Tarafından İptal Edildi
        PartiallyShipped = 7,   // Kısmen Kargolandı <--- YENİ
        Completed = 8           // Tamamlandı (Kısmi gönderim sonrası kalanlar da teslim edildiğinde)
    }
}