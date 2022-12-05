namespace API.Models.DTO
{
    public class UserChatDto
    {
        public string Username {get;set;}
        public byte[] Image { get; set; }

        // here we start with connection persistance, checkout test
    }
} 

// Steps
// model for connectionDto
// migrate
// change connection mapping
// change onConnect how user gets his connection
// ------- 