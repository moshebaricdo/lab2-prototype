import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faXmarkCircle,
  faCircleMinus,
  faSpinner,
  faClipboardCheck,
  faStop,
} from "@fortawesome/free-solid-svg-icons";

interface ValidationTest {
  id: string;
  description: string;
  status: "pass" | "fail" | "skip";
}

const defaultTests: ValidationTest[] = [
  {
    id: "1",
    description: "Painter moves and paints at least 5 times",
    status: "pass",
  },
  {
    id: "2",
    description: "Painter paints (1,0) to (5,0)",
    status: "fail",
  },
  {
    id: "3",
    description: "Painter ends at (6, 3)",
    status: "skip",
  },
];

export function ValidationPanel() {
  const [isValidating, setIsValidating] = useState(false);
  const [tests] = useState<ValidationTest[]>(defaultTests);

  const handleValidate = () => {
    setIsValidating(true);
    setTimeout(() => {
      setIsValidating(false);
    }, 1000);
  };

  const handleStopValidation = () => {
    setIsValidating(false);
  };

  return (
    <div className="box-border content-stretch flex flex-col gap-[10px] items-start p-[8px] relative size-full">
      <div className="bg-[#f0f2f5] relative rounded-[4px] shrink-0 w-full">
        <div className="overflow-clip rounded-[inherit] size-full">
          <div className="box-border content-stretch flex flex-col gap-[12px] items-start p-[12px] relative w-full">
            {/* Validation Table */}
            <div className="bg-white relative rounded-[4px] shrink-0 w-full">
              <div className="content-stretch flex flex-col items-start overflow-clip relative rounded-[inherit] w-full">
                {/* Header */}
                <div className="bg-white relative shrink-0 w-full">
                  <div className="content-stretch flex items-start overflow-clip relative rounded-[inherit] w-full">
                    <div className="basis-0 bg-[#dfe3e9] grow min-h-px min-w-px relative shrink-0">
                      <div
                        aria-hidden="true"
                        className="absolute border-[#b7c1cb] border-[0px_1px_0px_0px] border-solid inset-0 pointer-events-none"
                      />
                      <div className="flex flex-row items-center size-full">
                        <div className="box-border content-stretch flex gap-[10px] items-center pb-[6px] pt-[7px] px-[12px] relative w-full">
                          <p
                            className="leading-[17.6px] not-italic relative shrink-0 text-[#292f36] text-[10px] text-center text-nowrap tracking-[0.4px] uppercase whitespace-pre"
                            style={{
                              fontFamily: "var(--font-body)",
                              fontWeight: "var(--font-weight-semibold)",
                            }}
                          >
                            Test
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-[#dfe3e9] box-border content-stretch flex gap-[10px] items-center justify-center pb-[6px] pt-[7px] px-[8px] relative shrink-0 w-[60px]">
                      <p
                        className="leading-[17.6px] not-italic relative shrink-0 text-[#292f36] text-[10px] text-center text-nowrap tracking-[0.4px] uppercase whitespace-pre"
                        style={{
                          fontFamily: "var(--font-body)",
                          fontWeight: "var(--font-weight-semibold)",
                        }}
                      >
                        Result
                      </p>
                    </div>
                  </div>
                  <div
                    aria-hidden="true"
                    className="absolute border-[#b7c1cb] border-[0px_0px_1px] border-solid inset-0 pointer-events-none"
                  />
                </div>

                {/* Rows */}
                {tests.map((test) => (
                  <div
                    key={test.id}
                    className="bg-white relative shrink-0 w-full"
                  >
                    <div className="content-stretch flex items-start overflow-clip relative rounded-[inherit] w-full">
                      <div className="basis-0 grow min-h-px min-w-px relative self-stretch shrink-0">
                        <div
                          aria-hidden="true"
                          className="absolute border-[#b7c1cb] border-[0px_1px_0px_0px] border-solid inset-0 pointer-events-none"
                        />
                        <div className="size-full">
                          <div className="box-border content-stretch flex gap-[10px] items-start px-[12px] py-[8px] relative size-full">
                            <p
                              className="basis-0 grow leading-[21.56px] min-h-px min-w-px not-italic relative shrink-0 text-[#424d59] text-[14px]"
                              style={{
                                fontFamily: "var(--font-body)",
                                fontWeight: "var(--font-weight-normal)",
                              }}
                            >
                              {test.description}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="box-border content-stretch flex flex-col items-center justify-center pb-[8px] pt-[10px] px-[10px] relative self-stretch shrink-0 w-[60px]">
                        {isValidating ? (
                          <div className="content-stretch flex h-[16px] items-center justify-center relative shrink-0">
                            <FontAwesomeIcon
                              icon={faSpinner}
                              className="text-[#69788a] text-[14px] animate-spin"
                            />
                          </div>
                        ) : (
                          <>
                            <div className="content-stretch flex h-[16px] items-center justify-center relative shrink-0">
                              <FontAwesomeIcon
                                icon={
                                  test.status === "pass"
                                    ? faCheckCircle
                                    : test.status === "fail"
                                      ? faXmarkCircle
                                      : faCircleMinus
                                }
                                className={`text-[14px] ${
                                  test.status === "pass"
                                    ? "text-[#3ea33e]"
                                    : test.status === "fail"
                                      ? "text-[#e02d16]"
                                      : "text-[#f9cb28]"
                                }`}
                              />
                            </div>
                            <p
                              className="leading-[21.56px] not-italic relative shrink-0 text-[#292f36] text-[14px] text-center text-nowrap whitespace-pre"
                              style={{
                                fontFamily: "var(--font-body)",
                                fontWeight: "var(--font-weight-semibold)",
                              }}
                            >
                              {test.status === "pass"
                                ? "Pass"
                                : test.status === "fail"
                                  ? "Fail"
                                  : "Skip"}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                    <div
                      aria-hidden="true"
                      className="absolute border-[#b7c1cb] border-[0px_0px_1px] border-solid inset-0 pointer-events-none"
                    />
                  </div>
                ))}
              </div>
              <div
                aria-hidden="true"
                className="absolute border border-[#b7c1cb] border-solid inset-0 pointer-events-none rounded-[4px]"
              />
            </div>

            {/* Validate / Stop Button */}
            <button
              onClick={isValidating ? handleStopValidation : handleValidate}
              className="bg-[#9657c7] min-w-[32px] relative rounded-[4px] shrink-0 w-full transition-colors hover:bg-[#6c468a] active:bg-[#9657c7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0093a4] focus-visible:ring-offset-2"
            >
              <div className="flex flex-row items-center justify-center min-w-inherit size-full">
                <div className="box-border content-stretch flex gap-[8px] items-center justify-center min-w-inherit not-italic px-[12px] py-[5px] relative text-[14px] text-center text-white w-full">
                  <div
                    className="flex flex-col justify-center leading-[0] relative shrink-0 w-[18px]"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    <FontAwesomeIcon
                      icon={isValidating ? faStop : faClipboardCheck}
                      className="leading-[1.25]"
                    />
                  </div>
                  <p
                    className="leading-[21.56px] relative shrink-0 text-nowrap whitespace-pre"
                    style={{
                      fontFamily: "var(--font-body)",
                      fontWeight: "var(--font-weight-semibold)",
                    }}
                  >
                    {isValidating ? "Stop validation" : "Validate"}
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
