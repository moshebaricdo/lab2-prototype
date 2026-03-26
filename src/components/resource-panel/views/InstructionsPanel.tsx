import { ScrollArea } from "../../ui/scroll-area";

export function InstructionsPanel() {
  return (
    <ScrollArea className="flex-1 min-h-0">
      <div className="box-border content-stretch flex flex-col gap-[8px] items-start p-[8px] relative w-full">
        <div className="bg-[#f0f2f5] relative rounded-[4px] shrink-0 w-full">
          <div className="overflow-clip rounded-[inherit] size-full">
            <div className="box-border content-stretch flex flex-col gap-[12px] items-start pb-[12px] pt-[8px] px-[12px] relative w-full">
              <div className="content-stretch flex flex-col gap-[4px] items-start not-italic relative shrink-0 w-full">
                <p
                  className="leading-[31.68px] relative shrink-0 text-[#292f36] text-[24px] w-full"
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontWeight: "var(--font-weight-semibold)",
                  }}
                >
                  Add a Heading
                </p>
                <p
                  className="leading-[21.56px] relative shrink-0 text-[#424d59] text-[14px] w-full"
                  style={{
                    fontFamily: "var(--font-body)",
                    fontWeight: "var(--font-weight-normal)",
                  }}
                >
                  Create an h1 element inside the body tag with the text
                  &quot;Welcome to My Website&quot;. This will be the main heading
                  for your webpage.
                </p>
              </div>
              <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
                <button className="bg-[#9657c7] min-w-[32px] relative rounded-[4px] shrink-0 w-full transition-colors hover:bg-[#6c468a] active:bg-[#9657c7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0093a4] focus-visible:ring-offset-2">
                  <div className="flex flex-row items-center justify-center min-w-inherit size-full">
                    <div className="box-border content-stretch flex gap-[8px] items-center justify-center min-w-inherit px-[12px] py-[5px] relative w-full">
                      <p
                        className="leading-[21.56px] not-italic relative shrink-0 text-[14px] text-center text-nowrap text-white whitespace-pre"
                        style={{
                          fontFamily: "var(--font-body)",
                          fontWeight: "var(--font-weight-semibold)",
                        }}
                      >
                        Show Example
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#f0f2f5] relative rounded-[4px] shrink-0 w-full">
          <div className="overflow-clip rounded-[inherit] size-full">
            <div className="box-border content-stretch flex flex-col gap-[12px] items-start pb-[12px] pt-[8px] px-[12px] relative w-full">
              <div className="content-stretch flex flex-col gap-[4px] items-start not-italic relative shrink-0 w-full">
                <p
                  className="leading-[31.68px] relative shrink-0 text-[#292f36] text-[24px] w-full"
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontWeight: "var(--font-weight-semibold)",
                  }}
                >
                  Style the Heading
                </p>
                <p
                  className="leading-[21.56px] relative shrink-0 text-[#424d59] text-[14px] w-full"
                  style={{
                    fontFamily: "var(--font-body)",
                    fontWeight: "var(--font-weight-normal)",
                  }}
                >
                  In your CSS file, what color property would you use to make
                  the h1 text blue? Enter the CSS property name below.
                </p>
              </div>
              <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
                <div className="content-stretch flex flex-col gap-[2px] items-start relative shrink-0 w-full">
                  <div className="content-stretch flex items-start relative shrink-0 w-full">
                    <div
                      className="basis-0 flex flex-col grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#292f36] text-[12px]"
                      style={{
                        fontFamily: "var(--font-body)",
                        fontWeight: "var(--font-weight-semibold)",
                      }}
                    >
                      <p className="leading-[19.68px]">CSS Property Name</p>
                    </div>
                  </div>
                  <div className="bg-white relative rounded-[4px] shrink-0 w-full">
                    <div
                      aria-hidden="true"
                      className="absolute border border-[#b7c1cb] border-solid inset-0 pointer-events-none rounded-[4px]"
                    />
                    <div className="size-full">
                      <div className="box-border content-stretch flex items-start px-[10px] py-[5px] relative w-full">
                        <input
                          type="text"
                          placeholder="Type your answer here..."
                          className="basis-0 flex flex-col grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#b7c1cb] text-[14px] bg-transparent border-0 outline-none placeholder:text-[#b7c1cb] text-foreground leading-[21.56px] w-full"
                          style={{
                            fontFamily: "var(--font-body)",
                            fontWeight: "var(--font-weight-normal)",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <button className="bg-[#9657c7] min-w-[32px] relative rounded-[4px] shrink-0 w-full transition-colors hover:bg-[#6c468a] active:bg-[#9657c7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0093a4] focus-visible:ring-offset-2">
                  <div className="flex flex-row items-center justify-center min-w-inherit size-full">
                    <div className="box-border content-stretch flex gap-[8px] items-center justify-center min-w-inherit px-[12px] py-[5px] relative w-full">
                      <p
                        className="leading-[21.56px] not-italic relative shrink-0 text-[14px] text-center text-nowrap text-white whitespace-pre"
                        style={{
                          fontFamily: "var(--font-body)",
                          fontWeight: "var(--font-weight-semibold)",
                        }}
                      >
                        Check Answer
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
