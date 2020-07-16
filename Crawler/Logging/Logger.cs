using System;

namespace Crawler.Logging
{
    public class Logger: ILogger
    {
        private readonly IColoredLineWriter _coloredLineWriter;

        public Logger(IColoredLineWriter coloredLineWriter)
        {
            _coloredLineWriter = coloredLineWriter;
        }

        public void LogDebug(string message)
        {
            LogInColor(message, ConsoleColor.Green);
        }

        public void LogInfo(string message)
        {
            LogInColor(message, ConsoleColor.DarkGray);
        }

        public void LogWarning(string message)
        {
            LogInColor(message, ConsoleColor.DarkYellow);
        }

        public void LogError(string message)
        {
            LogInColor(message, ConsoleColor.Red);
        }

        private void LogInColor(string message, ConsoleColor color)
        {
            _coloredLineWriter.WriteLine($"[{DateTime.Now.Millisecond}] {message}", color);
        }
    }
}
