using System;

namespace Crawler
{
    public class ColoredLineWriter: IColoredLineWriter
    {
        public void WriteLine(string line, ConsoleColor color)
        {
            ConsoleColor oldColor = Console.ForegroundColor;
            Console.ForegroundColor = color;
            Console.WriteLine(line);
            Console.ForegroundColor = oldColor;
        }
    }
}
