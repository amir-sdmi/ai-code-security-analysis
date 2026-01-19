import React, { useEffect, useState } from 'react';

// Written by ChatGPT4
const TableOfContents = () => {
    const [headings, setHeadings] = useState([]);

    useEffect(() => {
        // Find all h3 elements on the page
        const h3Elements = Array.from(document.querySelectorAll('h3'));

        // Extract the text and id from each h3 element
        const h3Data = h3Elements.map(h3 => ({
            text: h3.innerText,
            id: h3.id
        }));

        setHeadings(h3Data);
    }, []);

    return (
        <div className="table-of-contents">
            <ul>
                {headings.map(heading => (
                    <li key={heading.id}>
                        <a href={`#${heading.id}`}>{heading.text}</a>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default TableOfContents;

