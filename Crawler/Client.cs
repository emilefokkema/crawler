using System;
using System.Net.Http;
using System.Threading.Tasks;

namespace Crawler
{
    public class Client: IClient
    {
        private readonly HttpClient _httpClient;
        public Client(HttpClient httpClient)
        {
            _httpClient = httpClient;
            
        }

        public async Task Get(string url)
        {
            Console.WriteLine($"Going to get {url}");
            var request = new HttpRequestMessage();
            request.RequestUri = new Uri(url);
            request.Method = HttpMethod.Get;
            try
            {
                var response = await _httpClient.SendAsync(request, HttpCompletionOption.ResponseHeadersRead);
                await HandleResponse(response);
            }
            catch (Exception e)
            {
                Console.WriteLine(e);
                throw;
            }
        }

        private async Task HandleResponse(HttpResponseMessage response)
        {
            if (!response.IsSuccessStatusCode)
            {
                return;
            }

            var content = response.Content;
            var contentAsString = await content.ReadAsStringAsync();
            Console.WriteLine(contentAsString);
        }
    }
}
