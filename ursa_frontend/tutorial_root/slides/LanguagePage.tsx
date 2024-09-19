import { JSX } from "solid-js/jsx-runtime";
import BigMenuButton from "../../src/components/BigMenuButton";
import { For } from "solid-js";
import StarryBackground from "../../src/components/StarryBackground";

interface LanguagePageProps {
    styleOverwrite?: string;
    onSlideCompleted: () => void;
    onLanguageSelected: (language: string) => void;
}

const languages = ['DA', 'DE', 'NO', 'NL', 'EN', 'ES', 'FR', 'IT', 'PL', 'PT', 'RU', 'SV', 'TR', 'ZH'];

export default function LanguagePage(props: LanguagePageProps): JSX.Element {

    const onLanguageSelected = (language: string) => {
        props.onSlideCompleted();
        props.onLanguageSelected(language);
    }

    return (
        <div class="language-tutorial-page">
            <StarryBackground />
            <For each={languages}>{(language) => (
                <BigMenuButton onClick={() => onLanguageSelected(language)}>{language}</BigMenuButton>
            )}
            </For>
        </div>
    )
}