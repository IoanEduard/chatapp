using API.Hubs;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.SignalR;
using API.Helpers;
using API.Models.DTO;
using System.Drawing;
using API.DAL;
using Microsoft.EntityFrameworkCore;
using AutoMapper;
using System.Text.Json;
using Newtonsoft.Json;

[EnableCors("CorsPolicy")]
public class ChatHub : Hub
{
    private readonly static ConnectionMapping<string> _connections =
            new ConnectionMapping<string>();

    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly UserDbContext _context;
    private readonly IMapper _mapper;
    private bool HasProfile { get; set; }

    public ChatHub(
        IHttpContextAccessor httpContextAccessor, UserDbContext context, IMapper mapper)
    {
        _httpContextAccessor = httpContextAccessor;
        _context = context;
        _mapper = mapper;
    }

    public async Task SendMessage(string user, string photoUrl, string message)
    {
        await Clients.All.SendAsync("SendMessage", user, photoUrl, message);
    }

    public async Task SendMessageToUser(string receiverName, string receiverConnectionId, string senderConnectionId, string privateMessage, string senderName, string photoUrl)
    {
        try
        {
            await Clients.Client(receiverConnectionId).SendAsync("SendMessageToUser", receiverName, receiverConnectionId, senderConnectionId, privateMessage, senderName, photoUrl);
        }
        catch (Exception ex)
        {
            throw new Exception(ex.Message);
        }

    }

    public async Task UpdateUserConnectionKey(string userConnectionId, string oldKey, string newKey)
    {
        _connections.RenameKey(oldKey, newKey);

        await Clients.All.SendAsync("UpdatedConnectionKey");
        await Clients.All.SendAsync("UpdateConnectionUserName", oldKey, newKey);
        await Clients.All.SendAsync("UpdateConnectionList", _connections.GetAllActiveConnections(), oldKey, newKey);
    }

    public override async Task OnConnectedAsync()
    {
        try
        {
            var username = string.Empty;
            var randomPhoto = string.Empty;

            UserProfileDto userprofile = new UserProfileDto();

            var tokenValid = (bool)_httpContextAccessor.HttpContext.Items["tokenIsValid"];

            if (tokenValid)
            {
                await ConnectRegisteredUserWithToken(userprofile);
            }
            else
            {
                var localStorageProfile = _httpContextAccessor.HttpContext.Items["localStorageProfile"];
                var localStorageProfileDeserialized = JsonConvert.DeserializeObject<UserProfileDto>(localStorageProfile.ToString());

                if (localStorageProfileDeserialized == null)
                {
                    await ConnectAnonymousUserFirstTime(userprofile);
                }
                else
                {
                    await ConnectAnonymousUserWithPersistingProfile(userprofile);
                }
            }

            await Clients.All.SendAsync("UpdateConnectionsList", _connections.GetAllActiveConnections());
        }
        catch (Exception ex)
        {
            throw new Exception(ex.Message);
        }
    }

    public override async Task OnDisconnectedAsync(Exception ex)
    {
        var username = _httpContextAccessor.HttpContext.Items["username"].ToString();

        if (_connections.KeyExists(username))
        {
            var connections = _connections.GetConnections(username);
            foreach (var item in connections)
            {
                _connections.Remove(username, item);
            }
        }
        await Clients.All.SendAsync("UpdateConnectionsList", _connections.GetAllActiveConnections());
    }

    public async Task GetConnectionId()
    {
        var connection = _mapper.Map<ConnectionDto>(Context.Items["Connection"]);

        await Clients.Caller.SendAsync("GetConnectionId", Context.ConnectionId);
    }

    private async Task ConnectRegisteredUserWithToken(UserProfileDto userprofile)
    {
        var userId = int.TryParse(_httpContextAccessor.HttpContext.Items["id"].ToString(), out int id);

        var userProfileDb = await _context.UserProfiles.FirstOrDefaultAsync(u => u.Id == id);
        var userConnection = await _context.Users.Include(x => x.Connection).FirstOrDefaultAsync(u => u.Id == id);

        if (userProfileDb != null)
        {
            userprofile.Id = id;
        }

        if (userProfileDb.Name == null || userProfileDb.PhotoUrl == null)
        {
            if (userProfileDb.Name == null)
            {
                userProfileDb.Name = await RandomUsername();
            }

            if (userProfileDb.PhotoUrl == null)
            {
                userProfileDb.PhotoUrl = await RandomPhoto();
            }

            _context.Attach(userProfileDb);
            _context.Entry(userProfileDb).State = EntityState.Modified;

            await _context.SaveChangesAsync();
        }

        userprofile.ImagePublicId = userProfileDb.PublicId;
        userprofile.Name = userProfileDb.Name;
        userprofile.PhotoUrl = userProfileDb.PhotoUrl;

        _connections.Add(userprofile.Name, Context.ConnectionId);

        await Clients.Caller.SendAsync("GetYourUsername", userprofile);
    }

    private async Task ConnectAnonymousUserFirstTime(UserProfileDto userprofile)
    {
        userprofile.Name = await RandomUsername();
        userprofile.PhotoUrl = await RandomPhoto();

        _httpContextAccessor.HttpContext.Items["username"] = userprofile.Name;

        _connections.Add(userprofile.Name, Context.ConnectionId);
        await Clients.Caller.SendAsync("GetYourUsername", userprofile);
    }

    private async Task ConnectAnonymousUserWithPersistingProfile(UserProfileDto userprofile)
    {
        var profileData = _httpContextAccessor.HttpContext.Items["localStorageProfile"];
        var profileDataDeserialized = JsonConvert.DeserializeObject<UserProfileDto>(profileData.ToString());

        userprofile.Name = profileDataDeserialized.Name;
        userprofile.PhotoUrl = profileDataDeserialized.PhotoUrl;
        userprofile.Connection = profileDataDeserialized.Connection;

        _httpContextAccessor.HttpContext.Items["username"] = userprofile.Name;
        Context.Items["Connection"] = userprofile.Connection;

        if (!_connections.KeyExists(userprofile.Name))
        {
            _connections.Add(userprofile.Name, Context.ConnectionId);
        }

        await Clients.Caller.SendAsync("GetYourUsername", userprofile.Name);
    }
    private async Task<string> RandomUsername()
    {
        var listNames = (await JsonFileReader.ReadAsync<RandomName[]>(@"assets\names.json"));
        var random = listNames.PickRandom();

        while (_connections.KeyExists(random.Name))
        {
            random = listNames.PickRandom();
        }

        return await Task.FromResult(random.Name);
    }

    private async Task<string> RandomPhoto()
    {
        var listPhotos = (await JsonFileReader.ReadAsync<RandomName[]>(@"assets\imagesName.json"));

        return await Task.FromResult(listPhotos.PickRandom().Name);
    }
}