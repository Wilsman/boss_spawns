export function VersionLabel() {
  return (
    <footer className="fixed bottom-0 left-0 w-full bg-gray-800/30 py-2 backdrop-blur-sm z-50">
      <div className="w-full px-4">
        <div className="flex justify-between items-center">
          {/* Discord Button - Far Left */}
          <div className="flex items-center justify-center">
            <a
              href="https://discord.com/invite/3dFmr5qaJK"
              rel="nofollow"
              target="_blank"
              className="flex items-center"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://img.shields.io/discord/1298971881776611470?color=7289DA&label=Discord&logo=discord&logoColor=white"
                alt="Discord"
                style={{ maxWidth: "100%" }}
                className="h-5" // Adjusted height to better fit the footer
              />
            </a>
          </div>
          {/* Version Text - Far Right */}
          <span className="text-xs text-gray-500">
            <a
              href="https://buymeacoffee.com/wilsman77"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-purple-300 transition-colors duration-200"
            >
              Wilsman77
            </a>{" "}
            updated on 07/08/2025
          </span>
        </div>
      </div>
    </footer>
  );
}
