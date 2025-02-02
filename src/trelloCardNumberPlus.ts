import {
  CARD_SHORT_ID_SELECTOR,
  CARD_TITLE_SELECTOR,
  TCNP_NUMBER_CLASS,
  TCNP_NUMBER_CLASS_BOLD,
  TCNP_NUMBER_CLASS_SELECTOR,
} from './shared/const';
import {
  formatNumber,
  getCardNumberFromParent,
  getCardNumberFromURL,
  isCard,
  isDialogClosed,
  isDroppedCard,
  isAddedCard,
  isBoardExcluded,
} from './shared/utils';
import { Configs, configStorage } from './shared/storage';
import './trelloCardNumberPlus.css';

let configs: Configs = new Configs();
let isCurrentBoardExcluded = false;

configStorage.get(refresh);
configStorage.listen(refresh);
setupObserver();

function getCurrentBoardId() {
  return window.location.pathname.split('/')[2];
}

function refresh(updatedConfigs?: Configs): void {
  if (updatedConfigs) {
    configs = updatedConfigs;
  }
  isCurrentBoardExcluded = isBoardExcluded(configs.excludedBoards, getCurrentBoardId());

  setupNumbers();
  setupDialogNumber();
}

function setupObserver(): void {
  const observer = new MutationObserver((mutations: MutationRecord[]) => {
    mutations.forEach((mutation) => {
      const element = mutation.target as HTMLElement;

      // Board has been changed
      if (element.id === 'board') {
        refresh();
      }

      if (!element?.classList?.length) return;

      if (
        (isCard(element) && (mutation.addedNodes.length > 0 || isDroppedCard(element, mutation))) ||
        isDialogClosed(element, mutation) ||
        isAddedCard(element, mutation)
      ) {
        setupNumbers();
      }

      if (element.classList.contains('card-detail-window')) {
        setupDialogNumber();
      }
    });
  });

  observer.observe(document.body, {
    attributes: true,
    childList: true,
    subtree: true,
    attributeOldValue: true,
  });
}

function setupDialogNumber(): void {
  const title = document.querySelector(CARD_TITLE_SELECTOR);
  if (title && title.parentElement?.querySelector(TCNP_NUMBER_CLASS_SELECTOR) === null) {
    title.parentElement.style.display = 'flex';

    const cardNumber = getCardNumberFromURL(window.location.pathname);
    const numberSpan = document.createElement('h2');
    numberSpan.innerHTML = formatNumber(cardNumber, configs.numberFormat);
    numberSpan.style.color = configs.numberColor;
    numberSpan.classList.add(TCNP_NUMBER_CLASS, 'quiet');

    title.parentElement?.prepend(numberSpan);
  }
}

function setupNumbers(): void {
  document.querySelectorAll(CARD_SHORT_ID_SELECTOR).forEach((element) => {
    const htmlElement = element as HTMLElement;
    if (htmlElement) {
      htmlElement.innerHTML = formatNumber(getCardNumberFromParent(element), configs.numberFormat);
      htmlElement.style.color = configs.numberColor;
      htmlElement.classList.toggle(TCNP_NUMBER_CLASS, configs.cardNumbersActive && !isCurrentBoardExcluded);
      htmlElement.classList.toggle(TCNP_NUMBER_CLASS_BOLD, configs.cardNumbersBold);
    }
  });
}
