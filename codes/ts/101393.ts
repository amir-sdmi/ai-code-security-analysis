import {
  Directive,
  ElementRef,
  HostListener,
  Input,
  input,
} from '@angular/core';

@Directive({
  selector: '[appTooltip]',
  standalone: true,
})
export class TooltipDirective {
  // Tooltip built following:
  // https://www.youtube.com/watch?v=YPOwsP9GV0w
  // And modified to click using ChatGPT
  @Input('appTooltip') tooltipText!: string;
  placement = input.required<string>();
  delay: number = 3000;
  tooltip?: HTMLElement;
  offset = 10;

  constructor(private el: ElementRef) {}

  @HostListener('click', ['$event']) onClick(event: MouseEvent) {
    event.stopPropagation(); // Prevent click event from bubbling up
    if (!this.tooltip) {
      this.show(); // Creates and shows the tooltip
      this.setupClickOutsideListener(); // Track clicks outiside of tooltip and hide the tooltip
    } else {
      this.hide(); // Remove tooltip and eventlistener
    }
  }

  show() {
    this.create();
    this.setPosition();
    this.tooltip?.classList.add('ng-tooltip-show');
  }

  hide() {
    this.tooltip?.classList.remove('ng-tooltip-show');
    this.tooltip?.remove();
    this.tooltip = undefined;
    this.removeClickOutsideListener();
  }

  create() {
    this.tooltip = document.createElement('span');
    this.tooltip.classList.add('ng-tooltip');
    this.tooltip.innerHTML = this.tooltipText!;
    document.body.appendChild(this.tooltip);
  }

  setPosition() {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const elemRect = this.el.nativeElement.getBoundingClientRect();
    const tooltipRect = this.tooltip?.getBoundingClientRect();
    if (!tooltipRect) return;
    let left = tooltipRect.left;
    let top = tooltipRect.top;
    if (windowWidth < 850) {
      // If mobile, then center tooltip horizontally to the page (left = 0)
      if (
        // If there's space under the tooltip icon, place it there
        tooltipRect.height <
        windowHeight - (elemRect.top + elemRect.height)
      ) {
        top = elemRect.top + elemRect.height + this.offset;
      } else if (elemRect.top > tooltipRect.height) {
        // otherwise, if there is space at the top place it there
        top = elemRect.top - tooltipRect.height - this.offset;
      } else {
        // otherwise leave at the bottom (UI sucks, but everything still readable)
        top = elemRect.top + elemRect.height + this.offset;
      }
    } else {
      // If not mobile, then also calculate the 'left' in relation to tooltip icon
      switch (this.placement!()) {
        case 'top':
          top = elemRect.top - tooltipRect.height - this.offset;
          left = elemRect.left + (elemRect.width - tooltipRect.width) / 2;
          break;
        case 'bottom':
          top = elemRect.bottom + this.offset;
          left = elemRect.left + (elemRect.width - tooltipRect.width) / 2;
          break;
        case 'left':
          top = elemRect.top + (elemRect.height - tooltipRect.height) / 2;
          left = elemRect.left - tooltipRect.width - this.offset;
          break;
        case 'right':
          top = elemRect.top + (elemRect.height - tooltipRect.height) / 2;
          left = elemRect.right + this.offset;
          break;
        default:
          throw new Error('Invalid placement value ' + this.placement);
      }
    }

    if (this.tooltip) {
      this.tooltip.style.top = `${top}px`;
      this.tooltip.style.left = `${left}px`;
    }
  }

  private setupClickOutsideListener() {
    document.addEventListener('click', this.onClickOutside);
  }

  private removeClickOutsideListener() {
    document.removeEventListener('click', this.onClickOutside);
  }

  private onClickOutside = (event: MouseEvent) => {
    if (this.tooltip && !this.tooltip.contains(event.target as Node)) {
      this.hide();
    }
  };
}
