namespace API.Models.Entities
{
    public class Connection
    {
        public int Id { get; set; }
        public string ContextConnection { get; set; }
        public DateTime DateTimeConnected { get; set; }
        public DateTime DateTimeDisconnected { get; set; }
        public Guid Key { get; set; }
        public User User { get; set; }
    }
}