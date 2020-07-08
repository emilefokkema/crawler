namespace Crawler
{
    public class SuccessResult: Result
    {
        public string Content { get; }

        public SuccessResult(string content)
        {
            Success = true;
            Content = content;
        }
    }
}
