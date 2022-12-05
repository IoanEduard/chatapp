namespace API.Models.DTO
{
    public class ConnectionDto
    {
        public string ContextConnection { get; set; }
        public string DateTimeConnected { get; set; }
        public DateTime DateTimeDisconnected { get; set; }
        public Guid Key { get; set; }

        public override string ToString()
        {
            return $"{ContextConnection}_{DateTimeConnected}_{DateTimeDisconnected}_{Key}";
        }
    }
}